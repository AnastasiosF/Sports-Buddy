import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { location, radius = 10000, sport_id, skill_level, status = 'open' } = req.query;

    let query = supabase
      .from('matches')
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*),
        participants:match_participants (
          *,
          user:profiles (*)
        )
      `)
      .eq('status', status)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at');

    // Add sport filtering if provided
    if (sport_id) {
      query = query.eq('sport_id', sport_id);
    }

    // Add skill level filtering if provided
    if (skill_level && skill_level !== 'any') {
      query = query.eq('skill_level_required', skill_level);
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

export const getMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*),
        participants:match_participants (
          *,
          user:profiles (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMatch = async (req: Request, res: Response) => {
  try {
    const {
      sport_id,
      title,
      description,
      location,
      location_name,
      scheduled_at,
      duration = 60,
      max_participants = 2,
      skill_level_required = 'any'
    } = req.body;

    // Get user ID from authenticated request
    const created_by = req.user?.id;

    if (!created_by) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Convert location array to PostGIS POINT format
    const locationPoint = `POINT(${location[0]} ${location[1]})`;

    const { data, error } = await supabase
      .from('matches')
      .insert([{
        created_by,
        sport_id,
        title,
        description,
        location: locationPoint,
        location_name,
        scheduled_at,
        duration,
        max_participants,
        skill_level_required,
      }])
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Automatically add creator as confirmed participant
    await supabase
      .from('match_participants')
      .insert([{
        match_id: data.id,
        user_id: created_by,
        status: 'confirmed',
      }]);

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Convert location array to PostGIS POINT format if location is being updated
    if (cleanData.location && Array.isArray(cleanData.location)) {
      cleanData.location = `POINT(${cleanData.location[0]} ${cleanData.location[1]})`;
    }

    const { data, error } = await supabase
      .from('matches')
      .update(cleanData)
      .eq('id', id)
      .select(`
        *,
        sport:sports (*),
        creator:profiles!created_by (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user ID from authenticated request
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if match exists and is open
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, participants:match_participants(count)')
      .eq('id', id)
      .eq('status', 'open')
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found or not open' });
    }

    // Check if match is full
    const participantCount = match.participants[0]?.count || 0;
    if (participantCount >= match.max_participants) {
      return res.status(400).json({ error: 'Match is full' });
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingParticipant) {
      return res.status(400).json({ error: 'User already joined this match' });
    }

    // Add participant
    const { data, error } = await supabase
      .from('match_participants')
      .insert([{
        match_id: id,
        user_id,
        status: 'confirmed',
      }])
      .select(`
        *,
        user:profiles (*)
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update match status to full if at capacity
    if (participantCount + 1 >= match.max_participants) {
      await supabase
        .from('matches')
        .update({ status: 'full' })
        .eq('id', id);
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveMatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user ID from authenticated request
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('match_id', id)
      .eq('user_id', user_id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Update match status back to open if it was full
    await supabase
      .from('matches')
      .update({ status: 'open' })
      .eq('id', id)
      .eq('status', 'full');

    res.json({ message: 'Left match successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};