import { createRouter, createWebHashHistory } from 'vue-router';
import HomeLayout from '@/layouts/HomeLayout.vue';
import Home from '@/views/Home.vue';
import Discover from '@/views/Discover.vue';
import Library from '@/views/Library.vue';
import Login from '@/views/Login.vue';
import Settings from '@/views/Settings.vue';
import PlaylistDetail from '@/views/PlaylistDetail.vue';
import Search from '@/views/Search.vue';
import Lyrics from '@/views/Lyrics.vue';
import { MoeAuthStore } from '@/stores/store';


const routes = [
    {
        path: '/',
        component: HomeLayout,
        children: [
            { path: '', name: 'Index', component: Home },
            { path: '/discover', name: 'Discover', component: Discover },
            { path: '/library', name: 'Library', component: Library, meta: { requiresAuth: true } },
            { path: '/login', name: 'Login', component: Login },
            { path: '/settings', name: 'Settings', component: Settings },
            { path: '/playlistDetail', name: 'PlaylistDetail', component: PlaylistDetail },
            { path: '/search', name: 'Search', component: Search },
        ],
    },
    { path: '/lyrics', name: 'Lyrics', component: Lyrics },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// 全局导航守卫
router.beforeEach((to, from, next) => {
    console.log('完整的路由地址:', to.fullPath);
    const MoeAuth = MoeAuthStore()
    // 检查是否需要登录
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!MoeAuth.isAuthenticated) {
            next({
                path: '/login',
                query: { redirect: to.fullPath } 
            });
        } 
    } 
    next();
});

export default router;