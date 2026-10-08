export interface ElementMeniu {
  label: string
  icon: string
  to: string
  admin?: boolean
}

/** Sidebar menu, grouped like the legacy menu (Meniu.vue). */
export const MENIU: { titlu: string, items: ElementMeniu[] }[] = [
  {
    titlu: 'Operațiuni',
    items: [
      { label: 'Documente', icon: 'pi pi-file-edit', to: '/documente' },
    ],
  },
  {
    titlu: 'Rapoarte',
    items: [
      { label: 'Balanța analitică', icon: 'pi pi-chart-bar', to: '/rapoarte?raport=balanta' },
      { label: 'Lista de inventariere', icon: 'pi pi-list-check', to: '/rapoarte?raport=inventar' },
      { label: 'Fișa de cont', icon: 'pi pi-id-card', to: '/rapoarte?raport=fisa' },
      { label: 'Registru documente', icon: 'pi pi-book', to: '/rapoarte?raport=registru' },
    ],
  },
  {
    titlu: 'Nomenclatoare',
    items: [
      { label: 'Materiale', icon: 'pi pi-box', to: '/materiale' },
      { label: 'Locuri de dispunere', icon: 'pi pi-map-marker', to: '/locuri' },
    ],
  },
  {
    titlu: 'Administrare',
    items: [
      { label: 'Utilizatori', icon: 'pi pi-users', to: '/admin/utilizatori', admin: true },
      { label: 'Gestiuni', icon: 'pi pi-warehouse', to: '/admin/gestiuni', admin: true },
      { label: 'Plan de conturi', icon: 'pi pi-sitemap', to: '/admin/conturi', admin: true },
      { label: 'Categorii repere', icon: 'pi pi-tags', to: '/admin/categorii', admin: true },
      { label: 'Configurare', icon: 'pi pi-cog', to: '/admin/setari', admin: true },
    ],
  },
]
