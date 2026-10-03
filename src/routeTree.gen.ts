/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AttacksRouteImport } from './routes/attacks'
import { Route as ClaimsRouteImport } from './routes/claims'
import { Route as ConnectorsRouteImport } from './routes/connectors'
import { Route as ContinuityRouteImport } from './routes/continuity'
import { Route as EvidenceRouteImport } from './routes/evidence'
import { Route as ReceiptsRouteImport } from './routes/receipts'
import { Route as RulesRouteImport } from './routes/rules'
import { Route as ClaimsIndexRouteImport } from './routes/claims.index'
import { Route as ClaimsClaimIdRouteImport } from './routes/claims.$claimId'
import { Route as ClaimsNewRouteImport } from './routes/claims.new'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AttacksRoute = AttacksRouteImport.update({ id: '/attacks', path: '/attacks', getParentRoute: () => rootRouteImport } as any)
const ClaimsRoute = ClaimsRouteImport.update({ id: '/claims', path: '/claims', getParentRoute: () => rootRouteImport } as any)
const ConnectorsRoute = ConnectorsRouteImport.update({ id: '/connectors', path: '/connectors', getParentRoute: () => rootRouteImport } as any)
const ContinuityRoute = ContinuityRouteImport.update({ id: '/continuity', path: '/continuity', getParentRoute: () => rootRouteImport } as any)
const EvidenceRoute = EvidenceRouteImport.update({ id: '/evidence', path: '/evidence', getParentRoute: () => rootRouteImport } as any)
const ReceiptsRoute = ReceiptsRouteImport.update({ id: '/receipts', path: '/receipts', getParentRoute: () => rootRouteImport } as any)
const RulesRoute = RulesRouteImport.update({ id: '/rules', path: '/rules', getParentRoute: () => rootRouteImport } as any)
const ClaimsIndexRoute = ClaimsIndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => ClaimsRoute } as any)
const ClaimsClaimIdRoute = ClaimsClaimIdRouteImport.update({ id: '/$claimId', path: '/$claimId', getParentRoute: () => ClaimsRoute } as any)
const ClaimsNewRoute = ClaimsNewRouteImport.update({ id: '/new', path: '/new', getParentRoute: () => ClaimsRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/attacks': typeof AttacksRoute
  '/claims': typeof ClaimsRouteWithChildren
  '/connectors': typeof ConnectorsRoute
  '/continuity': typeof ContinuityRoute
  '/evidence': typeof EvidenceRoute
  '/receipts': typeof ReceiptsRoute
  '/rules': typeof RulesRoute
  '/claims/$claimId': typeof ClaimsClaimIdRoute
  '/claims/new': typeof ClaimsNewRoute
  '/claims/': typeof ClaimsIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/attacks': typeof AttacksRoute
  '/connectors': typeof ConnectorsRoute
  '/continuity': typeof ContinuityRoute
  '/evidence': typeof EvidenceRoute
  '/receipts': typeof ReceiptsRoute
  '/rules': typeof RulesRoute
  '/claims/$claimId': typeof ClaimsClaimIdRoute
  '/claims/new': typeof ClaimsNewRoute
  '/claims': typeof ClaimsIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/attacks': typeof AttacksRoute
  '/claims': typeof ClaimsRouteWithChildren
  '/connectors': typeof ConnectorsRoute
  '/continuity': typeof ContinuityRoute
  '/evidence': typeof EvidenceRoute
  '/receipts': typeof ReceiptsRoute
  '/rules': typeof RulesRoute
  '/claims/$claimId': typeof ClaimsClaimIdRoute
  '/claims/new': typeof ClaimsNewRoute
  '/claims/': typeof ClaimsIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/attacks' | '/claims' | '/connectors' | '/continuity' | '/evidence' | '/receipts' | '/rules' | '/claims/$claimId' | '/claims/new' | '/claims/'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/attacks' | '/connectors' | '/continuity' | '/evidence' | '/receipts' | '/rules' | '/claims/$claimId' | '/claims/new' | '/claims'
  id: '__root__' | '/' | '/attacks' | '/claims' | '/connectors' | '/continuity' | '/evidence' | '/receipts' | '/rules' | '/claims/$claimId' | '/claims/new' | '/claims/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AttacksRoute: typeof AttacksRoute
  ClaimsRoute: typeof ClaimsRouteWithChildren
  ConnectorsRoute: typeof ConnectorsRoute
  ContinuityRoute: typeof ContinuityRoute
  EvidenceRoute: typeof EvidenceRoute
  ReceiptsRoute: typeof ReceiptsRoute
  RulesRoute: typeof RulesRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/attacks': { id: '/attacks'; path: '/attacks'; fullPath: '/attacks'; preLoaderRoute: typeof AttacksRouteImport; parentRoute: typeof rootRouteImport }
    '/claims': { id: '/claims'; path: '/claims'; fullPath: '/claims'; preLoaderRoute: typeof ClaimsRouteImport; parentRoute: typeof rootRouteImport }
    '/connectors': { id: '/connectors'; path: '/connectors'; fullPath: '/connectors'; preLoaderRoute: typeof ConnectorsRouteImport; parentRoute: typeof rootRouteImport }
    '/continuity': { id: '/continuity'; path: '/continuity'; fullPath: '/continuity'; preLoaderRoute: typeof ContinuityRouteImport; parentRoute: typeof rootRouteImport }
    '/evidence': { id: '/evidence'; path: '/evidence'; fullPath: '/evidence'; preLoaderRoute: typeof EvidenceRouteImport; parentRoute: typeof rootRouteImport }
    '/receipts': { id: '/receipts'; path: '/receipts'; fullPath: '/receipts'; preLoaderRoute: typeof ReceiptsRouteImport; parentRoute: typeof rootRouteImport }
    '/rules': { id: '/rules'; path: '/rules'; fullPath: '/rules'; preLoaderRoute: typeof RulesRouteImport; parentRoute: typeof rootRouteImport }
    '/claims/': { id: '/claims/'; path: '/'; fullPath: '/claims/'; preLoaderRoute: typeof ClaimsIndexRouteImport; parentRoute: typeof ClaimsRoute }
    '/claims/$claimId': { id: '/claims/$claimId'; path: '/$claimId'; fullPath: '/claims/$claimId'; preLoaderRoute: typeof ClaimsClaimIdRouteImport; parentRoute: typeof ClaimsRoute }
    '/claims/new': { id: '/claims/new'; path: '/new'; fullPath: '/claims/new'; preLoaderRoute: typeof ClaimsNewRouteImport; parentRoute: typeof ClaimsRoute }
  }
}

interface ClaimsRouteChildren {
  ClaimsClaimIdRoute: typeof ClaimsClaimIdRoute
  ClaimsNewRoute: typeof ClaimsNewRoute
  ClaimsIndexRoute: typeof ClaimsIndexRoute
}
const ClaimsRouteChildren: ClaimsRouteChildren = { ClaimsClaimIdRoute, ClaimsNewRoute, ClaimsIndexRoute }
const ClaimsRouteWithChildren = ClaimsRoute._addFileChildren(ClaimsRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  AttacksRoute,
  ClaimsRoute: ClaimsRouteWithChildren,
  ConnectorsRoute,
  ContinuityRoute,
  EvidenceRoute,
  ReceiptsRoute,
  RulesRoute,
}

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
