import Vue from 'vue'
import Router from 'vue-router'
import Programs from '@/components/Program/Programs'
import Program from '@/components/Program/Program'
import Episode from '@/components/Episode/Episode'
import Xsplit from '@/components/Xsplit'
import Settings from '@/components/Settings'

Vue.use(Router)

export default new Router({
  routes: [
    {
      name: 'Root',
      path: '/',
      component: Programs
    },
    {
      name: 'Programs',
      path: '/programs',
      component: Programs
    },
    {
      name: 'Program',
      path: '/programs/:programId',
      component: Program
    },
    {
      name: 'Episode',
      path: '/programs/:programId/episodes/:episodeId',
      component: Episode
    },
    {
      name: 'Settings',
      path: '/settings',
      component: Settings
    },
    {
      name: 'Xsplit',
      path: '/xsplit',
      component: Xsplit
    }
  ]
})
