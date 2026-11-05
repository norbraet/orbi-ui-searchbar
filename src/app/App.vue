<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import NotificationToast from '@/features/notifications/NotificationToast.vue'
  import ThemeSelector from '@/features/theme/ui/ThemeSelector.vue'
  import LanguageSelector from '@/features/language-selector/ui/LanguageSelector.vue'

  const { t } = useI18n()
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
    <header class="site-header">
      <div class="main-header">
        <router-link to="/" class="logo">
          <img src="/orbi.svg" width="28" height="28" alt="" />
          <span>{{ t('common.appName') }}</span>
        </router-link>
        <div class="header-actions">
          <ThemeSelector />
          <LanguageSelector />
        </div>
      </div>
    </header>
    <main id="main-content" tabindex="-1">
      <router-view />
    </main>
  </div>
  <NotificationToast />
</template>

<style scoped>
  .app-shell {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 100dvh;
  }

  main,
  .site-header {
    transition: var(--motion-transition-colors);
    transition-property: background-color, border-color;
    min-width: 0;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    border-bottom: var(--border-width-thin) solid var(--color-border);
    background: var(--material-regular-background);
    backdrop-filter: var(--material-regular-filter);
    -webkit-backdrop-filter: var(--material-regular-filter);
  }

  .main-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-component-sm);
    max-width: var(--layout-max-width);
    min-height: 4.5rem;
    margin: 0 auto;
    padding: var(--space-component-sm) var(--space-page);
  }

  .logo {
    transition: var(--motion-transition-colors);
    display: inline-flex;
    align-items: center;
    gap: var(--space-component-xs);
    color: var(--color-text);
    font-weight: var(--text-label-weight);
    text-decoration: none;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-component-xs);
  }

  .skip-link {
    transition: var(--motion-transition-colors);
    position: fixed;
    top: var(--space-component-xs);
    left: var(--space-component-xs);
    z-index: var(--z-modal);
    padding: var(--space-component-sm);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text);
    transform: translateY(-200%);
  }

  .skip-link:focus {
    transform: translateY(0);
  }

  @media (max-width: 700px) {
    .main-header {
      padding-inline: var(--space-component-md);
    }

    .header-actions {
      gap: var(--space-component-nano);
    }
  }
</style>
