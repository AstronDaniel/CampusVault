import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BannerData {
    id: number;
    title: string;
    content?: string;
    image_url?: string;
    card_color: string;
    text_color: string;
    border_color?: string;
    footer_text?: string;
    action_text?: string;
    action_url?: string;
    action_type: 'link' | 'deep_link' | 'none';
    priority: number;
    style_options?: any;
}

class BannerService {
    private baseUrl = `${API_CONFIG.BASE_URL}/api/v1/banners`;

    /**
     * Get active banners for display in the mobile app
     * This is a public endpoint that doesn't require authentication
     */
    async getActiveBanners(): Promise<BannerData[]> {
        try {
            const apiUrl = `${this.baseUrl}/active`;
            console.log('🌐 BannerService: Making API call to:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('📡 BannerService: API response status:', response.status);
            console.log('📡 BannerService: API response ok:', response.ok);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('📭 BannerService: No active banners (404)');
                    return []; // No active banners
                }
                console.error('❌ BannerService: HTTP error! status:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const banners = await response.json() as BannerData[];
            console.log('✅ BannerService: Successfully parsed JSON response:', banners);
            console.log('📊 BannerService: Returning', (banners || []).length, 'banner(s)');
            
            return banners || [];
        } catch (error) {
            console.error('💥 BannerService: Error fetching active banners:', error);
            // Return empty array on error to prevent app crashes
            return [];
        }
    }

    /**
     * Check if there are any active banners (lightweight check)
     */
    async hasActiveBanners(): Promise<boolean> {
        try {
            const banners = await this.getActiveBanners();
            return banners.length > 0;
        } catch (error) {
            console.error('Error checking for active banners:', error);
            return false;
        }
    }

    /**
     * Get banners with caching support
     * @param cacheMinutes Cache duration in minutes (default: 5)
     */
    async getActiveBannersWithCache(cacheMinutes: number = 5): Promise<BannerData[]> {
        const cacheKey = 'active_banners';
        const cacheTimeKey = 'active_banners_time';
        
        console.log('🗂️ BannerService: Checking cache for active banners...');
        
        try {
            // Check cache first
            const [cachedTime, cachedBanners] = await Promise.all([
                AsyncStorage.getItem(cacheTimeKey),
                AsyncStorage.getItem(cacheKey)
            ]);
            
            if (cachedTime && cachedBanners) {
                const cacheAge = Date.now() - parseInt(cachedTime);
                const cacheValidityMs = cacheMinutes * 60 * 1000;
                
                console.log('⏰ BannerService: Cache age:', Math.round(cacheAge / 1000), 'seconds');
                console.log('⏰ BannerService: Cache validity:', Math.round(cacheValidityMs / 1000), 'seconds');
                
                if (cacheAge < cacheValidityMs) {
                    console.log('📦 BannerService: Using cached banners');
                    try {
                        const parsedBanners = JSON.parse(cachedBanners);
                        console.log('🔄 BannerService: Successfully parsed cached banners:', parsedBanners);
                        return parsedBanners;
                    } catch (parseError) {
                        console.warn('⚠️ BannerService: Error parsing cached banners, fetching fresh data:', parseError);
                        // Clear invalid cache and continue to fetch fresh data
                        await this.clearCache();
                    }
                } else {
                    console.log('⏰ BannerService: Cache expired, fetching fresh data');
                }
            } else {
                console.log('📭 BannerService: No cached data found, fetching fresh data');
            }

            // Fetch fresh data
            console.log('🆕 BannerService: Fetching fresh banner data...');
            const banners = await this.getActiveBanners();
            
            // Cache the results
            console.log('💾 BannerService: Caching banner results...');
            try {
                await Promise.all([
                    AsyncStorage.setItem(cacheKey, JSON.stringify(banners)),
                    AsyncStorage.setItem(cacheTimeKey, Date.now().toString())
                ]);
                console.log('✅ BannerService: Successfully cached banner data');
            } catch (cacheError) {
                console.warn('⚠️ BannerService: Error caching banners:', cacheError);
                // Continue without caching - don't fail the entire operation
            }
            
            console.log('🎯 BannerService: Returning fresh banner data:', banners);
            return banners;
        } catch (error) {
            // Try to return cached data on error
            try {
                const cachedBanners = await AsyncStorage.getItem(cacheKey);
                if (cachedBanners) {
                    const parsed = JSON.parse(cachedBanners);
                    console.info('Using cached banners due to fetch error');
                    return parsed;
                }
            } catch (cacheError) {
                console.error('Error reading cached banners:', cacheError);
            }
            
            console.error('Error fetching banners with cache:', error);
            return [];
        }
    }

    /**
     * Clear banner cache
     */
    async clearCache(): Promise<void> {
        try {
            await AsyncStorage.removeItem('active_banners');
            await AsyncStorage.removeItem('active_banners_time');
        } catch (error) {
            console.error('Error clearing banner cache:', error);
        }
    }
}

export const bannerService = new BannerService();
export type { BannerData };