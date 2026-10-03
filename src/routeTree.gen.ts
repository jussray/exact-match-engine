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

const IndexRoute=IndexRouteImport.update({id:'/',path:'/',getParentRoute:()=>rootRouteImport} as any)
const AttacksRoute=AttacksRouteImport.update({id:'/attacks',path:'/attacks',getParentRoute:()=>rootRouteImport} as any)
const ClaimsRoute=ClaimsRouteImport.update({id:'/claims',path:'/claims',getParentRoute:()=>rootRouteImport} as any)
const ConnectorsRoute=ConnectorsRouteImport.update({id:'/connectors',path:'/connectors',getParentRoute:()=>rootRouteImport} as any)
const ContinuityRoute=ContinuityRouteImport.update({id:'/continuity',path:'/continuity',getParentRoute:()=>rootRouteImport} as any)
const EvidenceRoute=EvidenceRouteImport.update({id:'/evidence',path:'/evidence',getParentRoute:()=>rootRouteImport} as any)
const ReceiptsRoute=ReceiptsRouteImport.update({id:'/receipts',path:'/receipts',getParentRoute:()=>rootRouteImport} as any)
const RulesRoute=RulesRouteImport.update({id:'/rules',path:'/rules',getParentRoute:()=>rootRouteImport} as any)
const ClaimsIndexRoute=ClaimsIndexRouteImport.update({id:'/',path:'/',getParentRoute:()=>ClaimsRoute} as any)
const ClaimsClaimIdRoute=ClaimsClaimIdRouteImport.update({id:'/$claimId',path:'/$claimId',getParentRoute:()=>ClaimsRoute} as any)
const ClaimsNewRoute=ClaimsNewRouteImport.update({id:'/new',path:'/new',getParentRoute:()=>ClaimsRoute} as any)

interface ClaimsRouteChildren { ClaimsClaimIdRoute:typeof ClaimsClaimIdRoute; ClaimsNewRoute:typeof ClaimsNewRoute; ClaimsIndexRoute:typeof ClaimsIndexRoute }
const ClaimsRouteChildren:ClaimsRouteChildren={ClaimsClaimIdRoute,ClaimsNewRoute,ClaimsIndexRoute}
const ClaimsRouteWithChildren=ClaimsRoute._addFileChildren(ClaimsRouteChildren)

const rootRouteChildren={IndexRoute,AttacksRoute,ClaimsRoute:ClaimsRouteWithChildren,ConnectorsRoute,ContinuityRoute,EvidenceRoute,ReceiptsRoute,RulesRoute}
export const routeTree=rootRouteImport._addFileChildren(rootRouteChildren)

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr:true; router:Awaited<ReturnType<typeof getRouter>>; config:Awaited<ReturnType<typeof startInstance.getOptions>> } }
