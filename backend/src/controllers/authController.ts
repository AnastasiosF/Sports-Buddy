import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { SignUpRequest, SignInRequest, VerifyEmailRequest, isValidEmail, isValidPassword, isValidUsername, sanitizeUsername } from '@sports-buddy/shared-types';

export const signUp = async (req: Request<{}, {}, SignUpRequest>, res: Response) => {
  try {
    const { email, password, username, full_name } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-50 characters, alphanumeric and underscores only' });
    }

    const sanitizedUsername = sanitizeUsername(username);

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', sanitizedUsername)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            username: sanitizedUsername,
            full_name: full_name || null,
          }
        ]);

      if (profileError) {
        return res.status(400).json({ error: profileError.message });
      }
    }

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: authData.user!.id,
        email: authData.user!.email!,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signIn = async (req: Request<{}, {}, SignInRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if user needs profile setup
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, bio, age, skill_level, location')
      .eq('id', data.user!.id)
      .single();

    // Determine if profile setup is needed
    const needsProfileSetup = !profile || (
      !profile.full_name &&
      !profile.bio &&
      !profile.age &&
      !profile.skill_level &&
      !profile.location
    );

    res.json({
      message: 'Signed in successfully',
      user: {
        id: data.user!.id,
        email: data.user!.email!,
      },
      session: {
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        expires_at: data.session!.expires_at,
      },
      needs_profile_setup: needsProfileSetup,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signOut = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request<{}, {}, VerifyEmailRequest>, res: Response) => {
  try {
    const { token, type } = req.body;

    if (!token || !type) {
      return res.status(400).json({ error: 'Token and type are required' });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Verification failed' });
    }

    res.json({
      message: 'Email verified successfully',
      user: {
        id: data.user.id,
        email: data.user.email!,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};