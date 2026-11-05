<script setup lang="ts">
  import { computed, ref, useId, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
  import type { VNode } from 'vue'
  import { calculatePanelHeight, calculateScrollTop } from '@/shared/lib/layout'
  import { getPreviewImageUrl } from '@/shared/lib/url'
  import SearchScopeChips from './SearchScopeChips.vue'
  import type {
    SearchPaletteLabels,
    SearchResult,
    SearchStatus,
    SearchSuggestion,
    SearchScope,
  } from '@/features/search-palette/types'

  const props = defineProps<{
    query: string
    scopes: readonly SearchScope[]
    scopeId: string | null
    scopeCounts: Readonly<Record<string, number>>
    status: SearchStatus
    results: readonly SearchResult[]
    suggestions: readonly SearchSuggestion[]
    selectedId: string | null
    selectedResult: SearchResult | null
    labels: SearchPaletteLabels
  }>()
  const emit = defineEmits<{
    query: [value: string]
    scope: [id: string | null]
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
  const scopeChips = ref<InstanceType<typeof SearchScopeChips> | null>(null)
  const body = ref<HTMLElement | null>(null)
  const resultsPane = ref<HTMLElement | null>(null)
  const resultsContent = ref<HTMLElement | null>(null)
  const previewContent = ref<HTMLElement | null>(null)
  const bodyHeight = ref<number>()
  let sizeObserver: ResizeObserver | undefined
  const listId = useId()
  const labelId = useId()
  const hasQuery = computed(() => Boolean(props.query.trim()))
  const selectedScope = computed(() => props.scopes.find((scope) => scope.id === props.scopeId))

  watch(
    () => props.scopes.map((scope) => scope.id),
    async () => {
      const focused = input.value?.ownerDocument.activeElement
      if (!focused || !scopeChips.value?.contains(focused)) return
      await nextTick()
      if (!focused.isConnected) input.value?.focus()
    },
    { flush: 'pre' }
  )

  function measureContent() {
    const area = body.value
    const results = resultsContent.value
    if (!area || !results) return
    if (!area.getClientRects().length) {
      bodyHeight.value = undefined
      return
    }
    // Keep the last settled size while another non-empty query is pending.
    if (hasQuery.value && props.status === 'loading' && bodyHeight.value !== undefined) return

    const paneHeight = (content: HTMLElement, style: CSSStyleDeclaration) => {
      return (
        content.scrollHeight +
        parseFloat(style.paddingTop) +
        parseFloat(style.paddingBottom) +
        parseFloat(style.borderTopWidth) +
        parseFloat(style.borderBottomWidth)
      )
    }
    const areaStyle = getComputedStyle(area)
    const resultStyle = getComputedStyle(results.parentElement!)
    const resultHeight = paneHeight(results, resultStyle)
    const previewHeight = previewContent.value
      ? paneHeight(previewContent.value, getComputedStyle(previewContent.value.parentElement!))
      : 0
    const resultLimit = parseFloat(resultStyle.maxHeight)
    const limit = parseFloat(areaStyle.maxHeight)
    bodyHeight.value = calculatePanelHeight({
      primaryHeight: resultHeight,
      secondaryHeight: previewHeight,
      stacked: areaStyle.flexDirection === 'column',
      primaryMaxHeight: Number.isFinite(resultLimit) ? resultLimit : undefined,
      maxHeight: Number.isFinite(limit) ? limit : undefined,
    })
  }

  watch(
    [resultsContent, previewContent],
    (elements, previous) => {
      previous.forEach((element) => {
        if (element) sizeObserver?.unobserve(element)
      })
      elements.forEach((element) => {
        if (element) sizeObserver?.observe(element)
      })
      measureContent()
    },
    { flush: 'post' }
  )

  watch(
    () => [props.status, props.query, props.results, props.selectedResult, props.suggestions],
    measureContent,
    { flush: 'post' }
  )

  onMounted(() => {
    sizeObserver = new ResizeObserver(measureContent)
    if (resultsContent.value) sizeObserver.observe(resultsContent.value)
    if (previewContent.value) sizeObserver.observe(previewContent.value)
    window.addEventListener('resize', measureContent)
    measureContent()
  })
  onBeforeUnmount(() => {
    sizeObserver?.disconnect()
    window.removeEventListener('resize', measureContent)
  })
  const optionId = (index: number) => `${listId}-${index}`
  const activeId = computed(() => {
    const index = props.results.findIndex((item) => item.id === props.selectedId)
    return index >= 0 ? optionId(index) : undefined
  })
  const announcement = computed(() => {
    if (props.status === 'loading') return props.labels.loading
    if (props.status === 'error') return props.labels.error
    if (props.status === 'success' && hasQuery.value)
      return [props.labels.resultCount(props.results.length), selectedScope.value?.label]
        .filter(Boolean)
        .join(' · ')
    return ''
  })
  const failedImage = ref<string | null>(null)
  const previewImage = computed(() => {
    const url = props.selectedResult?.preview?.imageUrl
    return failedImage.value === url ? undefined : getPreviewImageUrl(url)
  })

  function applySuggestion(query: string) {
    emit('query', query)
    input.value?.focus()
  }

  function clearScope() {
    emit('scope', null)
    input.value?.focus()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      emit('move', event.key === 'ArrowDown' ? 1 : -1)
      void nextTick(revealSelectedResult)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      emit('activate')
    }
  }

  function revealSelectedResult() {
    const pane = resultsPane.value
    const option = activeId.value ? input.value?.ownerDocument.getElementById(activeId.value) : null
    if (!pane || !option || !pane.contains(option)) return
    const style = getComputedStyle(pane)
    pane.scrollTop = calculateScrollTop({
      scrollTop: pane.scrollTop,
      viewportHeight: pane.clientHeight,
      itemTop: option.offsetTop,
      itemHeight: option.offsetHeight,
      paddingTop: parseFloat(style.paddingTop),
      paddingBottom: parseFloat(style.paddingBottom),
    })
  }

  watch(
    () => [props.query, props.results],
    () => {
      if (resultsPane.value) resultsPane.value.scrollTop = 0
    },
    { flush: 'post' }
  )

  watch(
    () => props.selectedResult?.id,
    () => {
      const pane = previewContent.value?.parentElement
      if (pane) pane.scrollTop = 0
    },
    { flush: 'post' }
  )

  defineExpose({ focusInput: () => input.value?.focus() })
</script>

<template>
  <div class="search-palette-header" :data-loading="status === 'loading'">
    <span :id="labelId" class="search-palette-sr-only">{{ labels.search }}</span>
    <svg
      class="search-palette-magnifier"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
    <input
      :id="`${listId}-input`"
      ref="input"
      class="search-palette-input"
      type="text"
      role="combobox"
      :aria-labelledby="labelId"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="hasQuery"
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

  <SearchScopeChips
    v-if="scopes.length"
    ref="scopeChips"
    :scopes="scopes"
    :selected-id="scopeId"
    :counts="scopeCounts"
    :show-counts="hasQuery && status === 'success'"
    :labels="labels"
    @select="emit('scope', $event)"
  />

  <div
    ref="body"
    class="search-palette-body"
    :style="bodyHeight === undefined ? undefined : { height: `${bodyHeight}px` }"
  >
    <section
      ref="resultsPane"
      class="search-palette-results"
      :aria-label="labels.results"
      :tabindex="results.length ? 0 : undefined"
    >
      <div ref="resultsContent" class="search-palette-results-content">
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
            @pointermove="$event.pointerType === 'mouse' && emit('select', result.id)"
            @mousedown.prevent
            @click="emit('activate', result.id)"
            @keydown.enter.prevent="emit('activate', result.id)"
          >
            <slot name="result" :result="result" :selected="result.id === selectedId">
              <span class="search-palette-kind">{{ result.kind }}</span>
              <strong>{{ result.title }}</strong>
              <span class="search-palette-location"
                >{{ result.source }} / {{ result.location }}</span
              >
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
        <div
          v-else-if="hasQuery && status === 'success' && !results.length"
          class="search-palette-message"
        >
          <p>{{ labels.empty }}</p>
          <button
            v-if="scopeId !== null"
            class="search-palette-action"
            type="button"
            @click="clearScope"
          >
            {{ labels.clearScope }}
          </button>
        </div>
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
      </div>
    </section>

    <section v-if="selectedResult" class="search-palette-preview" :aria-label="labels.preview">
      <div ref="previewContent" class="search-palette-preview-inner">
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
      </div>
    </section>
  </div>
  <footer class="search-palette-footer">
    <span>{{ labels.navigationHint }}</span>
    <span role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</span>
  </footer>
</template>
