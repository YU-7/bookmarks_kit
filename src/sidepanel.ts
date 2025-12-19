import { mount } from 'svelte'
import './app.css'
import SidepanelPage from './SidepanelPage.svelte'

const app = mount(SidepanelPage, {
  target: document.getElementById('app')!,
})

export default app
