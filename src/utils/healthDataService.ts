import { supabase } from './supabaseClient';
import imageUploadService from './imageUploadService';

export interface HealthData {
  id?: string;
  user_id?: string;
  data_type: 'therapist_chat' | 'posture_check' | 'saved_routines' | 'browser_data';
  data_key: string;
  data_value: any;
  image_urls?: string[];
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface TherapistChatSession {
  id?: string;
  user_id?: string;
  session_title?: string;
  messages: any[];
  ai_model_used?: string;
  session_duration?: number;
  mood_score?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PostureCheckSession {
  id?: string;
  user_id?: string;
  session_title?: string;
  posture_score: number;
  analysis_data: any;
  image_urls?: string[];
  recommendations?: any;
  duration_seconds?: number;
  created_at?: string;
}

export interface SavedRoutine {
  id?: string;
  user_id?: string;
  routine_name: string;
  routine_type: 'workout' | 'meditation' | 'stretching' | 'custom';
  routine_data: any;
  image_urls?: string[];
  is_favorite?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HealthProgress {
  id?: string;
  user_id?: string;
  metric_type: 'mood' | 'posture' | 'fitness' | 'weight' | 'sleep' | 'stress';
  metric_value: number;
  metric_unit?: string;
  notes?: string;
  image_urls?: string[];
  recorded_at?: string;
}

export interface ImageMetadata {
  id?: string;
  user_id?: string;
  image_url: string;
  image_type: 'posture' | 'fitness' | 'progress' | 'routine' | 'profile';
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags?: string[];
  created_at?: string;
}

class HealthDataService {
  // Check if supabase is available
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
  }

  // Get current user
  private async getCurrentUser() {
    this.checkSupabase();
    const { data: { user }, error } = await supabase!.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // Create or update user profile
  async createUserProfile(profileData: Partial<{ email: string; full_name: string; phone_number: string; date_of_birth: string; emergency_contact: string; account_type: string }>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profileData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Generic health data operations
  async saveHealthData(data: HealthData) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data: savedData, error } = await supabase!
      .from('user_health_data')
      .upsert({
        user_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return savedData;
  }

  async getHealthData(dataType: string, dataKey?: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    let query = supabase!
      .from('user_health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', dataType);

    if (dataKey) {
      query = query.eq('data_key', dataKey);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Browser data migration
  async migrateBrowserData(browserData: any) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const migrationPromises = [];

    // Migrate therapist chat sessions
    if (browserData.therapistChat && browserData.therapistChat.length > 0) {
        for (const session of browserData.therapistChat) {
        const migrationPromise = supabase!
          .from('therapist_chat_sessions')
          .upsert({
            user_id: user.id,
            session_title: session.session_title || 'Migrated Session',
            messages: session.messages || [],
            ai_model_used: session.ai_model_used || 'unknown',
            session_duration: session.session_duration || 0,
            mood_score: session.mood_score || 0,
            tags: session.tags || [],
            created_at: session.created_at || new Date().toISOString()
          });
        migrationPromises.push(migrationPromise);
      }
    }

    // Migrate posture check sessions
    if (browserData.postureCheck && browserData.postureCheck.length > 0) {
        for (const session of browserData.postureCheck) {
        const migrationPromise = supabase!
          .from('posture_check_sessions')
          .upsert({
            user_id: user.id,
            session_title: session.session_title || 'Migrated Posture Check',
            posture_score: session.posture_score || 0,
            analysis_data: session.analysis_data || {},
            image_urls: session.image_urls || [],
            recommendations: session.recommendations || {},
            duration_seconds: session.duration_seconds || 0,
            created_at: session.created_at || new Date().toISOString()
          });
        migrationPromises.push(migrationPromise);
        }
      }

      // Migrate saved routines
    if (browserData.savedRoutines && browserData.savedRoutines.length > 0) {
        for (const routine of browserData.savedRoutines) {
        const migrationPromise = supabase!
          .from('saved_routines')
          .upsert({
            user_id: user.id,
            routine_name: routine.routine_name || 'Migrated Routine',
            routine_type: routine.routine_type || 'custom',
            routine_data: routine.routine_data || {},
            image_urls: routine.image_urls || [],
            is_favorite: routine.is_favorite || false,
            created_at: routine.created_at || new Date().toISOString()
          });
        migrationPromises.push(migrationPromise);
      }
    }

    // Migrate health progress
    if (browserData.healthProgress && browserData.healthProgress.length > 0) {
      for (const progress of browserData.healthProgress) {
        const migrationPromise = supabase!
          .from('health_progress')
          .upsert({
            user_id: user.id,
            metric_type: progress.metric_type || 'general',
            metric_value: progress.metric_value || 0,
            metric_unit: progress.metric_unit || '',
            notes: progress.notes || '',
            image_urls: progress.image_urls || [],
            recorded_at: progress.recorded_at || new Date().toISOString()
          });
        migrationPromises.push(migrationPromise);
      }
    }

    try {
      await Promise.all(migrationPromises);
      return { success: true, migratedCount: migrationPromises.length };
    } catch (error) {
      console.error('Error migrating browser data:', error);
      throw error;
    }
  }

  // Check if browser data migration is needed
  async checkBrowserDataMigration() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('user_health_data')
      .select('data_key')
      .eq('user_id', user.id)
      .eq('data_type', 'browser_data')
      .eq('data_key', 'migration_completed')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !data; // Return true if migration is needed
  }

  // Therapist chat operations
  async saveTherapistChatSession(session: Omit<TherapistChatSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('therapist_chat_sessions')
      .insert({
        user_id: user.id,
        ...session
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTherapistChatSessions() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('therapist_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Posture check operations
  async savePostureCheckSession(sessionData: Omit<PostureCheckSession, 'id' | 'user_id' | 'created_at'>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    try {
      const { data, error } = await supabase!
        .from('posture_check_sessions')
        .insert({
          user_id: user.id,
          ...sessionData
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving posture session:', error);
        throw error;
      }
      
      console.log('Posture session saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to save posture session:', error);
      throw error;
    }
  }

  async getPostureCheckSessions() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    try {
      const { data, error } = await supabase!
        .from('posture_check_sessions')
        .select(`
          id,
          user_id,
          session_title,
          posture_score,
          analysis_data,
          image_urls,
          recommendations,
          duration_seconds,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posture sessions:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch posture sessions:', error);
      throw error;
    }
  }

  async getPostureCheckSession(sessionId: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    try {
      const { data, error } = await supabase!
        .from('posture_check_sessions')
        .select(`
          id,
          user_id,
          session_title,
          posture_score,
          analysis_data,
          image_urls,
          recommendations,
          duration_seconds,
          created_at
        `)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching posture session:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to fetch posture session:', error);
      throw error;
    }
  }

  async deletePostureCheckSession(sessionId: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    try {
      // First get the session to check if it has images to delete
      const session = await this.getPostureCheckSession(sessionId);
      
      // Delete the session
      const { error } = await supabase!
        .from('posture_check_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting posture session:', error);
        throw error;
      }
      
      // If session had images, try to delete them from storage
      if (session && session.image_urls && session.image_urls.length > 0) {
        try {
          for (const imageUrl of session.image_urls) {
            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `posture/${fileName}`;
            
            // Delete from storage
            await supabase!.storage
              .from('user-images')
              .remove([filePath]);
              
            console.log('Deleted image from storage:', filePath);
          }
        } catch (storageError) {
          console.warn('Failed to delete images from storage:', storageError);
          // Continue even if image deletion fails
        }
      }
      
      console.log('Posture session deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete posture session:', error);
      throw error;
    }
  }

  // Save posture session with images
  async savePostureCheckSessionWithImages(
    sessionData: Omit<PostureCheckSession, 'id' | 'user_id' | 'created_at'>,
    imageData?: string
  ) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    let imageUrls: string[] = [];

    // Upload image if provided
    if (imageData) {
      try {
        // Use the enhanced image upload service
        const uploadResult = await imageUploadService.uploadBase64ImageToStorage(
          imageData,
          'posture',
          `posture-${user.id}-${Date.now()}.jpg`,
          'Posture Check Image',
          ['posture', 'analysis']
        );
        imageUrls.push(uploadResult.url);
      } catch (error) {
        console.error('Failed to upload posture image:', error);
        // Continue without image if upload fails
      }
    }

    // Save posture session
    const { data: postureSession, error: sessionError } = await supabase!
      .from('posture_check_sessions')
      .insert({
        user_id: user.id,
        ...sessionData,
        image_urls: imageUrls
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error saving posture session:', sessionError);
      throw sessionError;
    }

    console.log('Posture session with images saved successfully:', postureSession);
    return postureSession;
  }

  // Saved routines operations
  async saveSavedRoutine(routine: Omit<SavedRoutine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('saved_routines')
      .insert({
        user_id: user.id,
        ...routine
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSavedRoutines() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('saved_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateSavedRoutine(routineId: string, updates: Partial<SavedRoutine>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('saved_routines')
      .update(updates)
      .eq('id', routineId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSavedRoutine(routineId: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { error } = await supabase!
      .from('saved_routines')
      .delete()
      .eq('id', routineId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  }

  // Health progress operations
  async saveHealthProgress(progress: Omit<HealthProgress, 'id' | 'user_id' | 'recorded_at'>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('health_progress')
      .insert({
        user_id: user.id,
        ...progress
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHealthProgress(metricType?: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    let query = supabase!
      .from('health_progress')
      .select('*')
      .eq('user_id', user.id);

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Image metadata operations
  async saveImageMetadata(metadata: Omit<ImageMetadata, 'id' | 'user_id' | 'created_at'>) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('image_metadata')
      .insert({
        user_id: user.id,
        ...metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getImageMetadata(imageType?: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    let query = supabase!
      .from('image_metadata')
      .select('*')
      .eq('user_id', user.id);

    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Cross-account data sharing
  async shareDataWithUser(sharedWithEmail: string, dataType: string, permissionLevel: 'read' | 'write' | 'admin' = 'read') {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    // Get the user to share with
    const { data: sharedWithUser, error: userError } = await supabase!
      .from('user_profiles')
      .select('id')
      .eq('email', sharedWithEmail)
      .single();

    if (userError || !sharedWithUser) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase!
      .from('data_sharing_permissions')
      .upsert({
        user_id: user.id,
        shared_with_user_id: sharedWithUser.id,
        data_type: dataType,
        permission_level: permissionLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSharedData() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('data_sharing_permissions')
      .select(`
        *,
        shared_with_user:user_profiles!data_sharing_permissions_shared_with_user_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    return data;
  }

  // Health analytics operations
  async saveHealthAnalytics(analyticsType: string, analyticsData: any, insights?: any, recommendations?: any) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase!
      .from('health_analytics')
      .insert({
        user_id: user.id,
        analytics_type: analyticsType,
        analytics_data: analyticsData,
        insights: insights,
        recommendations: recommendations
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHealthAnalytics(analyticsType?: string) {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    
    let query = supabase!
      .from('health_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (analyticsType) {
      query = query.eq('analytics_type', analyticsType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Dashboard summary
  async getDashboardSummary() {
    this.checkSupabase();
    const user = await this.getCurrentUser();

    try {
      // Get counts for different data types
      const [
        { count: therapistSessions },
        { count: postureChecks },
        { count: savedRoutines },
        { count: healthProgress }
      ] = await Promise.all([
        supabase!.from('therapist_chat_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase!.from('posture_check_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase!.from('saved_routines').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase!.from('health_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      // Get detailed data for calculations
      const [
        { data: postureCheckData },
        { data: healthProgressData }
      ] = await Promise.all([
        supabase!.from('posture_check_sessions').select('posture_score').eq('user_id', user.id),
        supabase!.from('health_progress').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false })
      ]);

      // Calculate metrics
      const averagePostureScore = this.calculateAveragePostureScore(postureCheckData || []);
      const progressStreak = this.calculateProgressStreak(healthProgressData || []);
      const fitnessProgress = this.calculateFitnessProgress(healthProgressData || []);

      // Calculate overall health score
      const healthScore = this.calculateHealthScore({
        therapistSessions: therapistSessions || 0,
        postureChecks: postureChecks || 0,
        savedRoutines: savedRoutines || 0,
        healthProgress: healthProgress || 0
      });

      // Get recent activities
      const recentActivities = await this.getRecentActivities();

      return {
        totalTherapistSessions: therapistSessions || 0,
        totalPostureChecks: postureChecks || 0,
        totalSavedRoutines: savedRoutines || 0,
        healthScore,
        recentActivities,
        averagePostureScore,
        progressStreak,
        fitnessProgress
      };

    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        totalTherapistSessions: 0,
        totalPostureChecks: 0,
        totalSavedRoutines: 0,
        healthScore: 0,
        recentActivities: [],
        averagePostureScore: 0,
        progressStreak: 0,
        fitnessProgress: 0
      };
    }
  }

  private calculateHealthScore(metrics: any): number {
    const weights = {
      therapistSessions: 0.2,
      postureChecks: 0.25,
      savedRoutines: 0.15,
      healthProgress: 0.15
    };

    const maxValues = {
      therapistSessions: 10,
      postureChecks: 20,
      savedRoutines: 15,
      healthProgress: 30
    };

    let score = 0;
    for (const [metric, value] of Object.entries(metrics)) {
      const weight = weights[metric as keyof typeof weights];
      const maxValue = maxValues[metric as keyof typeof maxValues];
      if (weight && maxValue && typeof value === 'number') {
        score += (Math.min(value, maxValue) / maxValue) * weight * 100;
      }
    }

    return Math.round(score);
  }

  private calculateAveragePostureScore(postureChecks: any[]): number {
    if (postureChecks.length === 0) return 0;
    const totalScore = postureChecks.reduce((sum, check) => sum + (check.posture_score || 0), 0);
    return Math.round(totalScore / postureChecks.length);
  }

  private calculateProgressStreak(healthProgress: any[]): number {
    if (healthProgress.length === 0) return 0;
    
    // Sort by recorded_at and calculate consecutive days
    const sortedProgress = healthProgress
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const progress of sortedProgress) {
      const progressDate = new Date(progress.recorded_at);
      const daysDiff = Math.floor((currentDate.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        streak++;
        currentDate = progressDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  private calculateFitnessProgress(healthProgress: any[]): number {
    if (healthProgress.length === 0) return 0;
    
    // Calculate average mood score (simplified)
    const totalMoodScore = healthProgress.reduce((sum, progress) => sum + (progress.metric_value || 0), 0);
    return Math.round(totalMoodScore / healthProgress.length);
  }

  private async getRecentActivities() {
    this.checkSupabase();
    const user = await this.getCurrentUser();
    const activities = [];

    try {
      // Get recent therapist sessions
      const { data: recentSessions } = await supabase!
        .from('therapist_chat_sessions')
        .select('session_title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentSessions) {
        activities.push(...recentSessions.map(session => ({
          type: 'therapy',
          title: session.session_title || 'Therapy Session',
          date: session.created_at,
          icon: 'Psychology'
        })));
      }

      // Get recent posture checks
      const { data: recentPosture } = await supabase!
        .from('posture_check_sessions')
        .select('session_title, created_at, posture_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentPosture) {
        activities.push(...recentPosture.map(check => ({
          type: 'posture',
          title: check.session_title || 'Posture Check',
          date: check.created_at,
          score: check.posture_score,
          icon: 'Accessibility'
        })));
      }

      // Get recent health progress
      const { data: recentHealthProgress } = await supabase!
        .from('health_progress')
        .select('metric_type, metric_value, recorded_at')
      .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(3);

      if (recentHealthProgress) {
        activities.push(...recentHealthProgress.map(progress => ({
          type: 'health',
          title: `${progress.metric_type} Progress`,
          date: progress.recorded_at,
          score: progress.metric_value,
          icon: 'HealthAndSafety'
        })));
      }

      // Sort all activities by date and return top 5
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  // Browser storage utilities
  static getBrowserData() {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = {
        therapistChat: JSON.parse(localStorage.getItem('healthAI_therapistChat') || '[]'),
        postureCheck: JSON.parse(localStorage.getItem('healthAI_postureCheck') || '[]'),
        savedRoutines: JSON.parse(localStorage.getItem('healthAI_savedRoutines') || '[]'),
        healthProgress: JSON.parse(localStorage.getItem('healthAI_healthProgress') || '[]')
      };
      
      return data;
    } catch (error) {
      console.error('Error reading browser data:', error);
      return null;
    }
  }

  static saveBrowserData(key: string, data: any) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`healthAI_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving browser data:', error);
    }
  }

  static clearBrowserData() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('healthAI_therapistChat');
      localStorage.removeItem('healthAI_postureCheck');
      localStorage.removeItem('healthAI_savedRoutines');
      localStorage.removeItem('healthAI_healthProgress');
    } catch (error) {
      console.error('Error clearing browser data:', error);
    }
  }
}

// Export static methods for browser data operations
export const getBrowserData = HealthDataService.getBrowserData;
export const saveBrowserData = HealthDataService.saveBrowserData;
export const clearBrowserData = HealthDataService.clearBrowserData;

export default HealthDataService; 