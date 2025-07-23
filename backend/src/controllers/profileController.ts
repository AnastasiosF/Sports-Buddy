import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { ProfileSetupRequest } from '@sports-buddy/shared-types';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_sports (
          *,
          sport:sports (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchProfiles = async (req: Request, res: Response) => {
  try {
    const { location, radius = 10000, sport_id, skill_level } = req.query;

    let query = supabase
      .from('profiles')
      .select(`
        *,
        user_sports (
          *,
          sport:sports (*)
        )
      `);

    // Add location-based filtering if provided
    if (location) {
      const [lng, lat] = (location as string).split(',').map(Number);
      query = query.filter('location', 'not.is', null);
      // Note: For production, you'd want to use PostGIS ST_DWithin function
    }

    // Add sport filtering if provided
    if (sport_id) {
      query = query.filter('user_sports.sport_id', 'eq', sport_id);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addUserSport = async (req: Request, res: Response) => {
  try {
    const { sport_id, skill_level, preferred } = req.body;

    // Get user ID from authenticated request
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase
      .from('user_sports')
      .insert([{
        user_id,
        sport_id,
        skill_level,
        preferred: preferred || false,
      }])
      .select(`
        *,
        sport:sports (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeUserSport = async (req: Request, res: Response) => {
  try {
    const { user_id, sport_id } = req.params;

    const { error } = await supabase
      .from('user_sports')
      .delete()
      .eq('user_id', user_id)
      .eq('sport_id', sport_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Sport removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setupProfile = async (req: Request<{}, {}, ProfileSetupRequest>, res: Response) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { full_name, bio, age, skill_level, location, location_name, preferred_sports } = req.body;

    // Update profile with setup data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name,
        bio,
        age,
        skill_level,
        location,
        location_name,
      })
      .eq('id', user_id)
      .select(`
        *,
        user_sports (
          *,
          sport:sports (*)
        )
      `)
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    // Add preferred sports if provided
    if (preferred_sports && preferred_sports.length > 0) {
      const sportInserts = preferred_sports.map(sport_id => ({
        user_id,
        sport_id,
        preferred: true,
        skill_level: skill_level || 'intermediate',
      }));

      const { error: sportsError } = await supabase
        .from('user_sports')
        .insert(sportInserts);

      if (sportsError) {
        console.error('Error adding sports:', sportsError);
      }
    }

    // Fetch updated profile with sports
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_sports (
          *,
          sport:sports (*)
        )
      `)
      .eq('id', user_id)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    res.json({
      message: 'Profile setup completed successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
