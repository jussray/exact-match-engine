import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";
import { Nav } from "../components/recon/Nav";
import { AuthProvider } from "../lib/auth";
import { ReconProvider } from "../lib/recon/store";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent(){return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md text-center"><h1 className="text-7xl font-bold">404</h1><p className="mt-3 text-sm text-muted-foreground">Page not found.</p><Link to="/" className="mt-6 inline-flex bg-primary px-4 py-2 text-sm text-primary-foreground">Go home</Link></div></div>;}

export const Route = createRootRouteWithContext<{queryClient:QueryClient}>()({
  head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1"},{title:"Exact Match Engine — Claims to Reality"},{name:"description",content:"Compare claimed state against independently observed evidence."},{property:"og:title",content:"Exact Match Engine — Claims to Reality"},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"stylesheet",href:appCss},{rel:"icon",href:"/favicon.svg",type:"image/svg+xml"}]}),
  shellComponent:RootShell,
  component:RootComponent,
  notFoundComponent:NotFoundComponent
});

function RootShell({children}:{children:ReactNode}){return <html lang="en"><head><HeadContent/></head><body>{children}<Scripts/></body></html>;}
function RootComponent(){const {queryClient}=Route.useRouteContext();return <QueryClientProvider client={queryClient}><AuthProvider><ReconProvider><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a><Nav/><main id="main" className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-8"><Outlet/></main><Toaster position="top-right"/></ReconProvider></AuthProvider></QueryClientProvider>;}
