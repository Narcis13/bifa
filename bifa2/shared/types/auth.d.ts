declare module '#auth-utils' {
  interface User {
    id: number
    username: string
    name: string | null
    rol: 'admin' | 'operator'
  }
}

export {}
