export const API_CONFIG = {
    BASE_URL: 'https://campus-vault-backend.vercel.app/api/v1/',
    TIMEOUT: 10000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login/mobile',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            RESET_PASSWORD: '/auth/password/reset/request',
            ME: '/auth/me',
        },
        DATA: {
            FACULTIES: '/faculties',
            PROGRAMS: '/programs',
            COURSE_UNITS: '/course-units',
            SEARCH_AUTOCOMPLETE: '/search/autocomplete',
            RESOURCES: '/resources',
            BOOKMARKS: '/resources/bookmarks',
        }
    }
};
