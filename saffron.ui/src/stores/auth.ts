// src/stores/auth.ts
import { defineStore } from 'pinia'
import {api} from 'src/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | {name:string, username: string, email: string },
    token: localStorage.getItem('token')
  }),

  actions: {
    async fetchUser() {
      if (!this.token) return
      
      try {
        const res = await api.get('auth/me')
        this.user = res.data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        await this.logout()
      }
    },

    login(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    async logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      await this.router.push({name:'login'})
    }
  }
})
