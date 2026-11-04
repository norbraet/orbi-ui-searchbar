<script setup lang="ts">
  import { computed, ref, useId, watch, nextTick } from 'vue'
  import type { VNode } from 'vue'
  import type {
    SearchPaletteLabels,
    SearchResult,
    SearchStatus,
    SearchSuggestion,
  } from '@/features/search-palette/types'

  const props = defineProps<{
    query: string
    status: SearchStatus
    results: readonly SearchResult[]
    suggestions: readonly SearchSuggestion[]
    selectedId: string | null
    selectedResult: SearchResult | null
    labels: SearchPaletteLabels
  }>()
  const emit = defineEmits<{
    query: [value: string]
    select: [id: string]
    move: [direction: -1 | 1]
    activate: [id?: string]
    retry: []
    dismiss: []
  }>()
  defineSlots<{
    result?(props: { result: SearchResult; selected: boolean }): VNode[]
    preview?(props: { result: SearchResult }): VNode[]
  }>()

  const input = ref<HTMLInputElement | null>(null)
  const listId = useId()
  const labelId = useId()
  const optionId = (index: number) => `${listId}-${index}`
  const activeId = computed(() => {
    const index = props.results.findIndex((item) => item.id === props.selectedId)
    return index >= 0 ? optionId(index) : undefined
  })
  const announcement = computed(() => {
    if (props.status === 'loading') return props.labels.loading
    if (props.status === 'error') return props.labels.error
    if (props.status === 'success') return props.labels.resultCount(props.results.length)
    return ''
  })
  const failedImage = ref<string | null>(null)
  const previewImage = computed(() => {
    const url = props.selectedResult?.preview?.imageUrl
    if (!url || failedImage.value === url) return undefined
    try {
      return ['http:', 'https:'].includes(new URL(url, 'https://preview.invalid').protocol)
        ? url
        : undefined
    } catch {
      return undefined
    }
  })

  function applySuggestion(query: string) {
    emit('query', query)
    input.value?.focus()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      emit('move', event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      emit('activate')
    }
  }

  watch(activeId, async () => {
    await nextTick()
    if (input.value && activeId.value) {
      input.value.ownerDocument
        .getElementById(activeId.value)
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  })

  defineExpose({ focusInput: () => input.value?.focus() })
</script>

<template>
  <div class="search-palette-header" :data-loading="status === 'loading'">
    <span :id="labelId" class="search-palette-sr-only">{{ labels.search }}</span>
    <span class="search-palette-magnifier" aria-hidden="true">⌕</span>
    <input
      :id="`${listId}-input`"
      ref="input"
      class="search-palette-input"
      type="text"
      role="combobox"
      :aria-labelledby="labelId"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="true"
      :aria-controls="listId"
      :aria-activedescendant="activeId"
      :value="query"
      :placeholder="labels.placeholder"
      autocomplete="off"
      spellcheck="false"
      @input="emit('query', ($event.target as HTMLInputElement).value)"
      @keydown="onKeydown"
    />
    <button
      class="search-palette-close"
      type="button"
      :aria-label="labels.close"
      @click="emit('dismiss')"
    >
      Esc
    </button>
  </div>

  <div class="search-palette-body">
    <section class="search-palette-results" :aria-label="labels.results">
      <div
        :id="listId"
        role="listbox"
        :aria-label="labels.results"
        :aria-busy="status === 'loading'"
        :data-status="status"
      >
        <div
          v-for="(result, index) in results"
          :id="optionId(index)"
          :key="result.id"
          role="option"
          tabindex="-1"
          :aria-selected="result.id === selectedId"
          class="search-palette-result"
          @pointerenter="emit('select', result.id)"
          @mousedown.prevent
          @click="emit('activate', result.id)"
          @keydown.enter.prevent="emit('activate', result.id)"
        >
          <slot name="result" :result="result" :selected="result.id === selectedId">
            <span class="search-palette-kind">{{ result.kind }}</span>
            <strong>{{ result.title }}</strong>
            <span class="search-palette-location">{{ result.source }} / {{ result.location }}</span>
            <span v-if="result.excerpt" class="search-palette-excerpt">{{ result.excerpt }}</span>
          </slot>
        </div>
      </div>
      <p v-if="status === 'loading'" class="search-palette-message">{{ labels.loading }}</p>
      <div v-else-if="status === 'error'" class="search-palette-message">
        <p>{{ labels.error }}</p>
        <button class="search-palette-action" type="button" @click="emit('retry')">
          {{ labels.retry }}
        </button>
      </div>
      <p v-else-if="status === 'success' && !results.length" class="search-palette-message">
        {{ labels.empty }}
      </p>
      <div
        v-if="suggestions.length"
        class="search-palette-suggestions"
        role="group"
        :aria-label="labels.suggestions"
      >
        <span>{{ labels.suggestions }}</span>
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          class="search-palette-suggestion"
          type="button"
          @click="applySuggestion(suggestion.query)"
        >
          {{ suggestion.label }}
        </button>
      </div>
    </section>

    <section class="search-palette-preview" :aria-label="labels.preview">
      <template v-if="selectedResult">
        <div :key="selectedResult.id" class="search-palette-preview-content">
          <slot name="preview" :result="selectedResult">
            <span class="search-palette-eyebrow"
              >{{ labels.preview }} · {{ selectedResult.kind }}</span
            >
            <h3>{{ selectedResult.title }}</h3>
            <p class="search-palette-location">
              {{ selectedResult.source }} / {{ selectedResult.location }}
            </p>
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="selectedResult.preview?.imageAlt ?? ''"
              class="search-palette-thumbnail"
              @error="failedImage = previewImage ?? null"
            />
            <p class="search-palette-preview-text">
              {{ selectedResult.preview?.text || labels.noPreview }}
            </p>
            <p v-if="selectedResult.preview?.updatedAt" class="search-palette-location">
              {{ labels.updated }} {{ selectedResult.preview.updatedAt }}
            </p>
            <p class="search-palette-destination">{{ selectedResult.url }}</p>
          </slot>
        </div>
        <button class="search-palette-action" type="button" @click="emit('activate')">
          {{ labels.openResult }} <span aria-hidden="true">↗</span>
        </button>
      </template>
      <span v-else class="search-palette-eyebrow">{{ labels.preview }}</span>
    </section>
  </div>
  <footer class="search-palette-footer">
    <span>{{ labels.navigationHint }}</span>
    <span role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</span>
  </footer>
</template>
