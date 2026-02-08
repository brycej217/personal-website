import * as THREE from 'three'
import Context from '../core/Context.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import Splash from '../core/scenes/Splash.js'
import Projects from '../core/scenes/Projects.js'

const loader = new FontLoader()
const font = await loader.loadAsync('public/assets/roboto.json')
const ctx = new Context(font)

// scenes
const splash = new Splash(ctx)
splash.createScene()
ctx.scenes['splash'] = splash

const projects = new Projects(ctx)
projects.createScene()
ctx.scenes['projects'] = projects

splash.enable(ctx)
projects.enable(ctx)

ctx.interacter.interactables = splash.objects.map((o) => o.mesh)
