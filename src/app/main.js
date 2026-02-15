import * as THREE from 'three'
import Context from '../core/Context.js'
import Splash from '../core/scenes/Splash.js'
import Projects from '../core/scenes/Projects.js'

const content = await fetch('public/assets/content.json').then((r) => r.json())

const ctx = new Context()

// scenes
const splash = new Splash(ctx)
splash.createScene(content.splash)
ctx.scenes['splash'] = splash

const projects = new Projects(ctx)
projects.createScene(content.projects)
ctx.scenes['projects'] = projects

splash.addScrollables(projects.getScrollables())
projects._hideForEntry()

splash.enable(ctx)
projects.enable(ctx)

ctx.interacter.interactables = splash.objects.map((o) => o.mesh)
