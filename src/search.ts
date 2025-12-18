import { mount } from 'svelte'
import './app.css'
import SearchPage from './SearchPage.svelte'

const app = mount(SearchPage, {
  target: document.getElementById('app')!,
})

export default app

