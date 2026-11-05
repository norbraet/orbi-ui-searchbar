<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import {
    SearchPalette,
    searchPaletteLabels,
    searchPaletteLabelsDe,
  } from '@/features/search-palette'
  import type { SearchResult } from '@/features/search-palette'
  import {
    createMockSearchService,
    mockSearchScopes,
    mockSearchResults,
    type MockScenario,
  } from '@/features/search-palette/mocks'

  const { t, locale } = useI18n()
  const searchOpen = ref(false)
  const searchContext = { workspace: 'demo' }
  const scenario = ref<MockScenario>('default')
  const search = computed(() => createMockSearchService(scenario.value))
  const scopes = computed(() =>
    mockSearchScopes.map((scope) => ({ ...scope, label: t('home.searchDemo.scopes.' + scope.id) }))
  )
  const searchLabels = computed(() =>
    locale.value === 'de' ? searchPaletteLabelsDe : searchPaletteLabels
  )
  function openSearch(event: MouseEvent) {
    // Safari does not focus buttons on click; give the dialog a return target.
    const launcher = event.currentTarget as HTMLButtonElement
    launcher.focus()
    searchOpen.value = true
  }

  function openSearchResult(result: SearchResult) {
    const url = new URL(result.url, window.location.origin)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      window.open(url.href, '_blank', 'noopener,noreferrer')
    }
  }
</script>

<template>
  <div class="playground">
    <h1>{{ t('home.title') }}</h1>
    <p class="description">{{ t('home.description') }}</p>
    <div class="launch-controls">
      <button class="search-launcher" type="button" aria-haspopup="dialog" @click="openSearch">
        {{ t('home.searchDemo.open') }}
      </button>
      <span class="shortcut"><kbd>⌘ / Ctrl + K</kbd></span>
    </div>
    <p class="search-hint">{{ t('home.searchDemo.hint') }}</p>
    <div class="demo-settings">
      <label for="search-demo-scenario"
        ><span class="scenario-label">{{ t('home.searchDemo.scenario') }}</span>
        <select id="search-demo-scenario" v-model="scenario">
          <option value="default">{{ t('home.searchDemo.default') }}</option>
          <option value="empty">{{ t('home.searchDemo.empty') }}</option>
          <option value="error">{{ t('home.searchDemo.error') }}</option>
          <option value="slow">{{ t('home.searchDemo.slow') }}</option>
          <option value="no-preview">{{ t('home.searchDemo.noPreview') }}</option>
        </select>
      </label>
      <p class="catalog">
        {{
          t('home.searchDemo.catalog', {
            count: mockSearchResults.length,
            scopes: mockSearchScopes.length,
          })
        }}
      </p>
    </div>
    <SearchPalette
      v-model:open="searchOpen"
      :search="search"
      :scopes="scopes"
      :labels="searchLabels"
      :context="searchContext"
      @activate="openSearchResult"
    />
  </div>
</template>

<style scoped>
  .playground {
    width: min(100%, 44rem);
    margin-inline: auto;
    padding: var(--space-section) var(--space-page);
    overflow-wrap: anywhere;
  }

  h1 {
    margin-bottom: var(--space-component-md);
    font-size: var(--text-h1-size);
    line-height: var(--text-line-tight);
  }

  .description {
    color: var(--color-text-muted);
  }

  .launch-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-component-md);
    margin-top: var(--space-component-xl);
  }

  .search-launcher {
    transition: var(--motion-transition-colors);
    min-height: var(--size-control-lg);
    padding: var(--space-component-sm) var(--space-component-xl);
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-button);
    background: var(--color-primary);
    color: var(--color-text-inverse);
    font: inherit;
    font-weight: var(--text-label-weight);
    cursor: pointer;
  }

  .search-launcher:hover {
    background: var(--color-primary-hover);
  }

  .search-launcher:active {
    background: var(--color-primary-active);
  }

  .shortcut,
  .search-hint,
  .catalog {
    transition: var(--motion-transition-colors);
    color: var(--color-text-muted);
    font-size: var(--text-caption-size);
  }

  kbd {
    font-family: var(--text-mono-font);
  }

  .search-hint {
    margin-top: var(--space-component-md);
  }

  .demo-settings {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-component-sm);
    margin-top: var(--space-section);
    padding-top: var(--space-component-xl);
    border-top: var(--border-width-thin) solid var(--color-border);
    font-size: var(--text-small-size);
  }

  select {
    transition: var(--motion-transition-colors);
    min-height: var(--size-control-sm);
    max-width: 100%;
    padding: var(--space-component-xs);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-control);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
  }

  .scenario-label {
    color: var(--color-text);
    transition: var(--motion-transition-colors);
  }

  label {
    display: block;
    min-width: 0;
  }

  .catalog {
    flex-basis: 100%;
  }

  @media (max-width: 700px) {
    .playground {
      padding-inline: var(--space-component-md);
    }
  }
</style>
