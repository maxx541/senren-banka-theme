import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { KYOTO_SVG } from './scene'
import { KYOTO_SIDE_SVG } from './scene_side'

// 千戀萬花・京都小鎮（白天）
// Washi-paper grays tinted toward the daytime sky, with the game's wine red as accent.
const { theme, problems } = makeColors({
  label: '千戀萬花・京都小鎮',
  only: 'light',
  roles: { accent: '#A8405A', danger: '#B8342C', success: '#4E7D4A', warning: '#A8701A', pro: '#5B5F9A' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#E9EEF3',
        'surface-1': '#F1F4F7',
        'surface-2': '#F8F9FB',
        'text-primary': '#2B1D26',
        'text-secondary': '#4E4150',
        'text-muted': '#655A68',
      },
    },
  },
})

const SCENE = 'senren-banka'
const COMMAND = 'senren-banka'

// Default: a live scene (the Svg below), the way the built-in example themes draw.
const SCENE_LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'light',
  backdrop: { scene: SCENE, glass: { blur: 0, tint: '#F4F7FA', opacity: 0.35 } },
}

// Side version: buildings and characters only at the two edges, street stones along the bottom, empty middle.
const SIDE = 'senren-banka-side'
const SIDE_LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'light',
  backdrop: { scene: SIDE, glass: { blur: 0, tint: '#F4F7FA', opacity: 0.35 } },
}

// Fallback: the same picture as a still image ground.
const IMAGE_LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'light',
  backdrop: { image: { source: 'assets/senren-banka.png' } },
}

async function apply($: EngineInterface, mode: 'scene' | 'image' | 'side'): Promise<string> {
  try {
    const set = await $.theme.set(mode === 'scene' ? SCENE_LOOK : mode === 'side' ? SIDE_LOOK : IMAGE_LOOK)

    return set.isDrawn
      ? `京都小鎮已套用（${mode === 'scene' ? '場景' : mode === 'side' ? '兩側' : '圖片'}模式）。`
      : `已送出，但目前沒有視窗畫它：${set.reason}`
  } catch (error) {
    return `套用失敗：${error instanceof Error ? error.message : String(error)}`
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    try {
      await $.command.register({
        name: COMMAND,
        description: '千戀萬花・京都小鎮背景：/senren-banka 套用（預設兩側版），/senren-banka full 完整版，/senren-banka image 改用靜態圖片，/senren-banka off 關閉',
      })
    } catch {
      // The look still applies without the command.
    }

    const said = await apply($, 'side')

    if (!said.startsWith('京都小鎮已套用')) {
      $.ui.status(said)
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === 'off') {
      try {
        await $.theme.clear()
      } catch (error) {
        return { text: `關閉失敗：${error instanceof Error ? error.message : String(error)}` }
      }

      return { text: '京都小鎮背景已關閉。' }
    }

    const said = await apply($, word === 'image' ? 'image' : word === 'full' ? 'scene' : 'side')

    if (said.startsWith('京都小鎮已套用')) {
      $.ui.status(undefined)
    }

    return { text: said }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.props.scene !== SCENE && e.props.scene !== SIDE) || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    if (e.props.scene === SIDE) {
      return <Svg isInteractive source={KYOTO_SIDE_SVG} alt="白天的京都小鎮像素畫：左右兩側是神社與祇園二年坂，下方是石板街" />
    }

    return <Svg isInteractive source={KYOTO_SVG} alt="白天的京都小鎮像素畫：神社、白川筋、祇園與八坂塔" />
  })
}
