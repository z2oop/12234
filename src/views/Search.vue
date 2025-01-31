<template>
    <div class="search-page">
        <div class="search-results">
            <h2 class="section-title">{{ $t('sou-suo-jie-guo') }}</h2>
            <template v-if="searchResults.length > 0">
                <ul>
                    <li v-for="(result, index) in searchResults" :key="index" class="result-item"
                        @click="playSong(result.FileHash, result.SongName, $getCover(result.Image, 480), result.SingerName)"
                        @contextmenu.prevent="showContextMenu($event, result)">
                        <img :src="$getCover(result.Image, 100)" alt="Cover" />
                        <div class="result-info">
                            <p class="result-name">{{ result.SongName }}</p>
                            <p class="result-type">{{ result.SingerName }}</p>
                        </div>
                        <div class="result-meta">
                            <div class="meta-column">
                                <p class="result-duration">{{ $formatMilliseconds(result.Duration) }}</p>
                                <p class="result-publish-date">{{ result.PublishDate }}</p>
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="pagination">
                    <button @click="prevPage" :disabled="currentPage === 1">{{ $t('shang-yi-ye') }}</button>
                    <div class="page-numbers">
                        <button v-for="pageNum in displayedPageNumbers" :key="pageNum" :class="['page-number', {
                            active: pageNum === currentPage,
                            'ellipsis': pageNum === '...'
                        }]" @click="pageNum !== '...' && goToPage(pageNum)" :disabled="pageNum === '...'">
                            {{ pageNum }}
                        </button>
                    </div>
                    <button @click="nextPage" :disabled="currentPage === totalPages">{{ $t('xia-yi-ye') }}</button>
                </div>
            </template>
        </div>
    </div>
    <ContextMenu ref="contextMenuRef" :playerControl="playerControl" />
</template>
<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import ContextMenu from '../components/ContextMenu.vue';
import { get } from '../utils/request';
import { useRoute } from 'vue-router';
const route = useRoute();
const searchQuery = ref(route.query.q || '');
const searchResults = ref([]);
const currentPage = ref(1);
const pageSize = ref(30);
const totalPages = ref(1);
const contextMenuRef = ref(null);
const showContextMenu = (event, song) => {
    if (contextMenuRef.value) {
        song.cover = song.Image?.replace("{size}", 480) || './assets/images/ico.png',
        song.timeLength = song.Duration;
        song.OriSongName = song.FileName;
        contextMenuRef.value.openContextMenu(event, song);
    }
};

onMounted(() => {
    performSearch();
});
watch(() => route.query.q, (newQuery) => {
    currentPage.value = 1;
    searchQuery.value = newQuery;
    performSearch();
});
const props = defineProps({
    playerControl: Object
});
const playSong = (hash, name, img, author) => {
    props.playerControl.addSongToQueue(hash, name, img, author);
};
const performSearch = async () => {
    if (!searchQuery.value) return;
    try {
        const response = await get('/search', {
            keywords: searchQuery.value,
            page: currentPage.value,
            pagesize: pageSize.value,
        });

        if (response.status === 1) {
            searchResults.value = response.data.lists;
            totalPages.value = Math.ceil(response.data.total / pageSize.value);
        }
    } catch (error) {
        console.error("搜索请求失败", error);
    }
};

// 分页操作
const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        performSearch(); // 执行搜索
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        performSearch(); // 执行搜索
    }
};

const displayedPageNumbers = computed(() => {
    const delta = 2; // 当前页前后显示的页码数
    let pages = [];

    if (totalPages.value <= 7) {
        // 如果总页数小于等于7，显示所有页码
        for (let i = 1; i <= totalPages.value; i++) {
            pages.push(i);
        }
    } else {
        // 始终显示第一页
        pages.push(1);

        // 计算中间页码的范围
        let leftBound = Math.max(2, currentPage.value - delta);
        let rightBound = Math.min(totalPages.value - 1, currentPage.value + delta);

        // 添加左边的省略号
        if (leftBound > 2) {
            pages.push('...');
        }

        // 添加中间的页码
        for (let i = leftBound; i <= rightBound; i++) {
            pages.push(i);
        }

        // 添加右边的省略号
        if (rightBound < totalPages.value - 1) {
            pages.push('...');
        }

        // 始终显示最后一页
        pages.push(totalPages.value);
    }

    return pages;
});

const goToPage = (page) => {
    currentPage.value = page;
    performSearch();
};
</script>

<style scoped>
.search-results {
    padding: 20px;
}

.result-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.3s;
    cursor: pointer;
    border-radius: 5px;
    gap: 10px;
}

.result-item:hover {
    background-color: #f5f5f5;
}

.result-item img {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    margin-right: 10px;
}

.result-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0; /* 防止flex子项溢出 */
}

.result-meta {
    display: flex;
    margin-left: auto;
    min-width: 120px;
    justify-content: flex-end;
    padding-right: 20px;
}

.meta-column {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
}

.result-name {
    font-size: 16px;
    font-weight: bold;
    height: 23px;
    margin: 0;
    max-width: 900px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.result-duration,
.result-publish-date {
    font-size: 14px;
    color: #888;
    margin: 0;
    white-space: nowrap;
}

.result-duration {
    color: #666;
}

.result-publish-date {
    font-size: 12px;
    color: #999;
}

.result-type {
    font-size: 14px;
    color: #666;
    margin: 6px 0 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px 0;
    gap: 10px;
}

.page-numbers {
    display: flex;
    gap: 5px;
}

.page-number {
    padding: 8px 12px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    color: #333;
    min-width: 40px;
    transition: all 0.3s;
}

.page-number:hover {
    background-color: var(--primary-color);
    color: white;
}

.page-number.active {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.pagination button {
    padding: 8px 15px;
    background-color: white;
    color: #333;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
    background-color: var(--primary-color);
    color: white;
}

.pagination button:disabled {
    background-color: white;
    color: #999;
    cursor: not-allowed;
    border-color: #ddd;
}

.section-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 30px;
    color: var(--primary-color);
}

.page-number.ellipsis {
    background-color: transparent;
    border: none;
    cursor: default;
    pointer-events: none;
    padding: 8px 8px;
    min-width: 30px;
}

.page-number.ellipsis:hover {
    background-color: transparent;
    color: #333;
}
</style>