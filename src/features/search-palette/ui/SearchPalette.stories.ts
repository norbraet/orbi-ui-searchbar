import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import SearchPalette from './SearchPalette.vue'
import { createMockSearchService, mockSearchScopes } from '../mocks'

const meta = {
  title: 'Features/SearchPalette',
  component: SearchPalette,
  tags: ['autodocs'],
  args: { search: createMockSearchService(), scopes: mockSearchScopes, shortcut: false },
  render: (args) => ({
    components: { SearchPalette },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template:
      '<button type="button" @click="open = true">Open search</button><SearchPalette v-bind="args" v-model:open="open" />',
  }),
} satisfies Meta<typeof SearchPalette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    const input = await canvas.findByRole('combobox', { name: 'Search' })
    await expect(input).toHaveFocus()
    await canvas.findByRole('button', { name: 'Architecture decisions' })
    await expect(canvas.queryAllByRole('option')).toHaveLength(0)
    await userEvent.type(input, 'search')
    await canvas.findByRole('option', { name: /Search behavior and presentation/ })
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Keyboard interaction checklist' })).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const Empty: Story = { args: { search: createMockSearchService('empty') } }
export const Error: Story = { args: { search: createMockSearchService('error') } }
export const Loading: Story = { args: { search: createMockSearchService('slow') } }
export const WithoutScopes: Story = { args: { scopes: [] } }
export const ScopeChips: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    await userEvent.type(canvas.getByRole('combobox'), 'release checklist')
    await canvas.findByRole('option', { name: /Release checklist/ })
    const chips = within(canvas.getByRole('group', { name: 'Search scope' }))
    await userEvent.click(chips.getByRole('button', { name: /^Links/ }))
    await expect(chips.getByRole('button', { name: /^Links/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await userEvent.click(await canvas.findByRole('button', { name: 'Search all content' }))
    await canvas.findByRole('option', { name: /Release checklist/ })
    await expect(canvas.getByRole('combobox')).toHaveValue('release checklist')
    await expect(canvas.getByRole('combobox')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const MissingPreview: Story = {
  args: { search: createMockSearchService('no-preview') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    await userEvent.click(await canvas.findByRole('button', { name: 'Design guidelines' }))
    await canvas.findByRole('option', { name: /Designing with materials/ })
    await waitFor(() =>
      expect(canvas.getByText('No preview available. Open the result to read more.')).toBeVisible()
    )
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const CustomSlots: Story = {
  render: (args) => ({
    components: { SearchPalette },
    setup() {
      return { args, open: ref(false) }
    },
    template: `
      <button type="button" @click="open = true">Open search</button>
      <SearchPalette v-bind="args" v-model:open="open">
        <template #result="{ result, selected }">
          <strong>{{ selected ? 'Selected: ' : '' }}{{ result.title }}</strong>
        </template>
        <template #preview="{ result }">
          <h3>Details: {{ result.title }}</h3>
        </template>
      </SearchPalette>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    await userEvent.type(canvas.getByRole('combobox'), 'search')
    await canvas.findByRole('option', { name: 'Selected: Search behavior and presentation' })
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('option', { name: 'Selected: Keyboard interaction checklist' })
    ).toHaveAttribute('aria-selected', 'true')
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Details: Keyboard interaction checklist' })
      ).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const Dark: Story = {
  decorators: [() => ({ template: '<div data-theme="dark"><story /></div>' })],
}
