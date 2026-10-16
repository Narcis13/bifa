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
    titlu: 'Mijloace fixe',
    items: [
      { label: 'Registru MF', icon: 'pi pi-building', to: '/mijloace-fixe' },
      { label: 'Înregistrare', icon: 'pi pi-plus-circle', to: '/mijloace-fixe/inregistrare' },
      { label: 'Transfer', icon: 'pi pi-arrows-h', to: '/mijloace-fixe/transfer' },
      { label: 'Casare', icon: 'pi pi-trash', to: '/mijloace-fixe/casare' },
      { label: 'Amortizare lunară', icon: 'pi pi-calendar', to: '/mijloace-fixe/amortizare' },
      { label: 'Documente MF', icon: 'pi pi-folder', to: '/mijloace-fixe/documente' },
    ],
  },
  {
    titlu: 'Rapoarte',
    items: [
      { label: 'Balanța analitică', icon: 'pi pi-chart-bar', to: '/rapoarte?raport=balanta' },
      { label: 'Lista de inventariere', icon: 'pi pi-list-check', to: '/rapoarte?raport=inventar' },
      { label: 'Situație repere', icon: 'pi pi-map', to: '/rapoarte?raport=situatie' },
      { label: 'Fișa de cont', icon: 'pi pi-id-card', to: '/rapoarte?raport=fisa' },
      { label: 'Registru documente', icon: 'pi pi-book', to: '/rapoarte?raport=registru' },
      { label: 'Fișa mijlocului fix', icon: 'pi pi-id-card', to: '/rapoarte?raport=fisa-mf' },
      { label: 'Situație amortizare', icon: 'pi pi-percentage', to: '/rapoarte?raport=amortizare-mf' },
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
