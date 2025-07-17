import { supabase } from './supabaseClient';

export interface HealthData {
  id?: string;
  user_id?: string;
  data_type: 'therapist_chat' | 'posture_check' | 'fitness_planner' | 'saved_routines' | 'browser_data';
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

export interface FitnessPlan {
  id?: string;
  user_id?: string;
  plan_name: string;
  plan_type: 'strength' | 'cardio' | 'flexibility' | 'weight_loss' | 'muscle_gain' | 'general';
  duration_days?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  exercises: any;
  nutrition_plan?: any;
  goals?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  // Get current user
  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // Create or update user profile
  async createUserProfile(profileData: Partial<{ email: string; full_name: string; phone_number: string; date_of_birth: string; emergency_contact: string; account_type: string }>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    const { data: savedData, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('user_health_data')
      .select('*')
      .eq('user_id', user.id)
      .eq('data_type', dataType);

    if (dataKey) {
      query = query.eq('data_key', dataKey);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Browser data migration
  async migrateBrowserData(browserData: any) {
    const user = await this.getCurrentUser();
    
    // Start migration tracking
    const { data: migration, error: migrationError } = await supabase
      .from('browser_data_migrations')
      .insert({
        user_id: user.id,
        migration_type: 'browser_to_account',
        migration_status: 'in_progress'
      })
      .select()
      .single();

    if (migrationError) throw migrationError;

    try {
      const migratedData = [];
      
      // Migrate therapist chat data
      if (browserData.therapistChat) {
        for (const session of browserData.therapistChat) {
          const savedSession = await this.saveTherapistChatSession({
            session_title: session.title || 'Migrated Session',
            messages: session.messages || [],
            ai_model_used: session.model || 'default',
            session_duration: session.duration || 0,
            mood_score: session.moodScore || null,
            tags: session.tags || []
          });
          migratedData.push(savedSession);
        }
      }

      // Migrate posture check data
      if (browserData.postureCheck) {
        for (const session of browserData.postureCheck) {
          const savedSession = await this.savePostureCheckSession({
            session_title: session.title || 'Migrated Posture Check',
            posture_score: session.score || 0,
            analysis_data: session.analysis || {},
            image_urls: session.imageUrls || [],
            recommendations: session.recommendations || {},
            duration_seconds: session.duration || 0
          });
          migratedData.push(savedSession);
        }
      }

      // Migrate fitness planner data
      if (browserData.fitnessPlanner) {
        for (const plan of browserData.fitnessPlanner) {
          const savedPlan = await this.saveFitnessPlan({
            plan_name: plan.name || 'Migrated Plan',
            plan_type: plan.type || 'general',
            duration_days: plan.duration || 90,
            difficulty_level: plan.difficulty || 'beginner',
            exercises: plan.exercises || {},
            nutrition_plan: plan.nutrition || {},
            goals: plan.goals || {},
            is_active: plan.isActive !== false
          });
          migratedData.push(savedPlan);
        }
      }

      // Migrate saved routines
      if (browserData.savedRoutines) {
        for (const routine of browserData.savedRoutines) {
          const savedRoutine = await this.saveSavedRoutine({
            routine_name: routine.name || 'Migrated Routine',
            routine_type: routine.type || 'custom',
            routine_data: routine.data || {},
            image_urls: routine.imageUrls || [],
            is_favorite: routine.isFavorite || false
          });
          migratedData.push(savedRoutine);
        }
      }

      // Update migration status
      await supabase
        .from('browser_data_migrations')
        .update({
          migration_status: 'completed',
          data_count: migratedData.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', migration.id);

      return {
        success: true,
        migratedCount: migratedData.length,
        data: migratedData
      };

    } catch (error) {
      // Update migration status to failed
      await supabase
        .from('browser_data_migrations')
        .update({
          migration_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', migration.id);

      throw error;
    }
  }

  // Check if user has browser data to migrate
  async checkBrowserDataMigration() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('browser_data_migrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('migration_type', 'browser_to_account')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  }

  // Therapist chat operations
  async saveTherapistChatSession(session: Omit<TherapistChatSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('therapist_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Posture check operations
  async savePostureCheckSession(session: Omit<PostureCheckSession, 'id' | 'user_id' | 'created_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .insert({
        user_id: user.id,
        ...session
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPostureCheckSessions() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Fitness planner operations
  async saveFitnessPlan(plan: Omit<FitnessPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .insert({
        user_id: user.id,
        ...plan
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFitnessPlans() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('fitness_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Saved routines operations
  async saveSavedRoutine(routine: Omit<SavedRoutine, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('saved_routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Health progress operations
  async saveHealthProgress(progress: Omit<HealthProgress, 'id' | 'user_id' | 'recorded_at'>) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    let query = supabase
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
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    let query = supabase
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
    const user = await this.getCurrentUser();
    
    // Get the user to share with
    const { data: sharedWithUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', sharedWithEmail)
      .single();

    if (userError || !sharedWithUser) {
      throw new Error('User not found');
    }

    const { data, error } = await supabase
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
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('data_sharing_permissions')
      .select(`
        *,
        user_profiles!data_sharing_permissions_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('shared_with_user_id', user.id)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  // Analytics operations
  async saveHealthAnalytics(analyticsType: string, analyticsData: any, insights?: any, recommendations?: any) {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('health_analytics')
      .insert({
        user_id: user.id,
        analytics_type: analyticsType,
        analytics_data: analyticsData,
        insights,
        recommendations
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getHealthAnalytics(analyticsType?: string) {
    const user = await this.getCurrentUser();
    
    let query = supabase
      .from('health_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (analyticsType) {
      query = query.eq('analytics_type', analyticsType);
    }

    const { data, error } = await query.order('generated_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Dashboard summary
  async getDashboardSummary() {
    const user = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('user_dashboard')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  // Browser storage utilities
  static getBrowserData() {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = {
        therapistChat: JSON.parse(localStorage.getItem('healthAI_therapistChat') || '[]'),
        postureCheck: JSON.parse(localStorage.getItem('healthAI_postureCheck') || '[]'),
        fitnessPlanner: JSON.parse(localStorage.getItem('healthAI_fitnessPlanner') || '[]'),
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
      localStorage.removeItem('healthAI_fitnessPlanner');
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