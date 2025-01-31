<template>
    <div class="music-card">
        <img :src="albumCover" alt="album cover" />
        <p>{{ songTitle }}</p>
        <p>{{ artist }}</p>
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    albumCover: {
        type: String,
        required: true,
    },
    songTitle: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
});
</script>

<style scoped>
.music-card {
    width: 150px;
    text-align: center;
}

.music-card img {
    width: 100%;
    border-radius: 10px;
}

.music-card p {
    margin: 5px 0;
}
</style>