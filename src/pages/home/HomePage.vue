<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useThemeStore } from '@/features/theme/model/useThemeStore'
  import { THEME_OPTIONS } from '@/features/theme/config'
  import { BaseButton } from '@/shared/components/BaseButton'
  import { computed, ref } from 'vue'
  import {
    SearchPalette,
    searchPaletteLabels,
    searchPaletteLabelsDe,
  } from '@/features/search-palette'
  import type { SearchResult } from '@/features/search-palette'
  import {
    createMockSearchService,
    mockSearchScopes,
    type MockScenario,
  } from '@/features/search-palette/mocks'

  const { t, locale } = useI18n()
  const appStore = useThemeStore()
  const searchOpen = ref(false)
  const searchContext = { workspace: 'demo' }
  const scenario = ref<MockScenario>('default')
  const search = computed(() => createMockSearchService(scenario.value))
  const scopes = computed(() =>
    mockSearchScopes.map((scope) => ({ ...scope, label: t(`home.searchDemo.scopes.${scope.id}`) }))
  )
  const searchLabels = computed(() =>
    locale.value === 'de' ? searchPaletteLabelsDe : searchPaletteLabels
  )

  function openSearchResult(result: SearchResult) {
    const url = new URL(result.url, window.location.origin)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      window.open(url.href, '_blank', 'noopener,noreferrer')
    }
  }

  const getThemeLabel = (theme: string) => t(`theme.options.${theme}`)

  const toggleTheme = () => {
    switch (appStore.theme) {
      case 'dark': {
        appStore.setTheme(THEME_OPTIONS.LIGHT)
        appStore.addNotification(
          t('theme.switchedTo', { theme: getThemeLabel(THEME_OPTIONS.LIGHT) }),
          'info'
        )
        break
      }
      case 'light': {
        appStore.setTheme(THEME_OPTIONS.SYSTEM)
        appStore.addNotification(
          t('theme.switchedTo', { theme: getThemeLabel(THEME_OPTIONS.SYSTEM) }),
          'info'
        )
        break
      }
      case 'system': {
        appStore.setTheme(THEME_OPTIONS.DARK)
        appStore.addNotification(
          t('theme.switchedTo', { theme: getThemeLabel(THEME_OPTIONS.DARK) }),
          'info'
        )
        break
      }
    }
  }

  const stack = [
    {
      label: 'Vue 3',
      link: 'https://vuejs.org/',
    },
    {
      label: 'TypeScript',
      link: 'https://www.typescriptlang.org/',
    },
    {
      label: 'Vite',
      link: 'https://vite.dev/',
    },
    {
      label: 'Vue Router',
      link: 'https://router.vuejs.org/',
    },
    {
      label: 'Pinia Store',
      link: 'https://pinia.vuejs.org/',
    },
    {
      label: 'Vue I18n',
      link: 'https://vue-i18n.intlify.dev/',
    },
    {
      label: 'Zod',
      link: 'https://zod.dev/',
    },
    {
      label: 'ESLint',
      link: 'https://eslint.org/',
    },
    {
      label: 'Prettier',
      link: 'https://prettier.io/',
    },
    {
      label: 'Lefthook',
      link: 'https://github.com/evilmartians/lefthook',
    },
    {
      label: 'Feature Sliced Design',
      link: 'https://feature-sliced.design/',
    },
    {
      label: 'mise',
      link: 'https://mise.jdx.dev/',
    },
    {
      label: 'Commitlint',
      link: 'https://commitlint.js.org/',
    },
    {
      label: 'Vitest',
      link: 'https://vitest.dev/',
    },
    {
      label: 'Vue Test Utils',
      link: 'https://test-utils.vuejs.org/',
    },
  ]
</script>

<template>
  <div class="container">
    <section class="search-demo" :aria-label="t('home.searchDemo.title')">
      <div>
        <h2>{{ t('home.searchDemo.title') }}</h2>
        <p>{{ t('home.searchDemo.description') }}</p>
      </div>
      <div class="search-demo-actions">
        <BaseButton @click="searchOpen = true"
          >{{ t('home.searchDemo.open') }} <kbd>⌘ / Ctrl + K</kbd></BaseButton
        >
        <label class="search-demo-scenario" for="search-demo-scenario">
          {{ t('home.searchDemo.scenario') }}
          <select id="search-demo-scenario" v-model="scenario">
            <option value="default">{{ t('home.searchDemo.default') }}</option>
            <option value="empty">{{ t('home.searchDemo.empty') }}</option>
            <option value="error">{{ t('home.searchDemo.error') }}</option>
            <option value="slow">{{ t('home.searchDemo.slow') }}</option>
            <option value="no-preview">{{ t('home.searchDemo.noPreview') }}</option>
          </select>
        </label>
      </div>
    </section>
    <SearchPalette
      v-model:open="searchOpen"
      :search="search"
      :scopes="scopes"
      :labels="searchLabels"
      :context="searchContext"
      @activate="openSearchResult"
    />
    <section class="hero">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.subtitle') }}</p>
      <div class="hero-actions">
        <BaseButton variant="primary" to="/guide">{{ t('home.viewGuide') }}</BaseButton>
        <BaseButton @click="toggleTheme">
          {{ t('theme.currentLabel', { theme: t(`theme.options.${appStore.theme}`) }) }}
        </BaseButton>
      </div>
    </section>

    <section class="stack card">
      <h2>{{ t('home.stackTitle') }}</h2>
      <div class="badge-grid">
        <a
          v-for="tool in stack"
          :key="tool.label"
          :href="tool.link"
          class="badge"
          target="_blank"
          rel="noopener noreferrer"
          >{{ tool.label }}</a
        >
      </div>
    </section>
  </div>
</template>

<style lang="css" scoped>
  .search-demo {
    display: grid;
    gap: var(--space-component-xl);
    padding: var(--space-component-xl);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-card);
    background: var(--color-surface);
  }

  .search-demo h2 {
    margin-bottom: var(--space-component-xs);
  }

  .search-demo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-component-sm);
    justify-content: flex-start;
    align-items: center;
  }

  .search-demo-scenario {
    display: flex;
    align-items: center;
    gap: var(--space-component-xs);
  }

  .search-demo select {
    font: inherit;
    color: var(--color-text);
    background: var(--color-surface);
    padding: var(--space-component-xs);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-tag);
  }

  .hero {
    text-align: center;
    /* stylelint-disable-next-line plugin/no-hardcoded-spacing */
    padding: 5rem 1rem 4rem;
  }

  .hero h1 {
    /* stylelint-disable-next-line plugin/no-hardcoded-typography */
    font-size: clamp(2rem, 6vw, 3.5rem);
    font-weight: var(--text-display-weight);
    letter-spacing: var(--text-spacing-heading);
    line-height: var(--text-line-tight);
    margin-bottom: var(--space-component-xl);
    color: var(--color-primary);
  }

  .hero p {
    font-size: var(--text-lg-size);
    max-width: 500px;
    margin: 0 auto var(--space-content);
  }

  .hero-actions {
    display: flex;
    gap: var(--space-component-sm);
    justify-content: center;
    flex-wrap: wrap;
  }

  .stack {
    max-width: 560px;
    margin: 0 auto;
    padding: var(--space-component-md);
    background-color: var(--color-bg-subtle);
    border-radius: var(--radius-card);
  }

  .stack h2 {
    font-size: var(--text-xs-size);
    font-weight: var(--text-label-weight);
    color: var(--color-text-muted);
    letter-spacing: var(--text-spacing-label);
    text-transform: uppercase;
    margin-bottom: var(--space-component-md);
  }

  .badge-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-component-xs);
  }

  .badge-grid a.badge {
    text-decoration: none;
    color: var(--color-text);
    padding: var(--space-component-nano);
    background-color: var(--color-surface-raised);
    border-radius: var(--radius-tag);
  }

  .badge-grid a.badge:hover {
    background-color: var(--color-primary-subtle);
    color: var(--color-primary);
    border-color: var(--color-primary-subtle);
  }
</style>
