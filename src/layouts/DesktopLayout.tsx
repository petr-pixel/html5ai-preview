import React, { useState } from 'react'
import { UnifiedSidebar, type ViewType } from '@/components/UnifiedSidebar'
import { PropertiesPanel } from '@/components/PropertiesPanel'
import { useAppStore } from '@/stores/app-store'
import type { PlatformId } from '@/types'

interface DesktopLayoutProps {
    children: React.ReactNode
    currentView: ViewType
    onViewChange: (view: ViewType) => void
}

export function DesktopLayout({ children, currentView, onViewChange }: DesktopLayoutProps) {
    const {
        platform, setPlatform,
        category, setCategory
    } = useAppStore()

    return (
        <div className="flex h-screen w-full bg-[#0F1115] text-white overflow-hidden">
            {/* Left Pane: Navigation */}
            <div className="flex-none z-20">
                <UnifiedSidebar
                    currentView={currentView}
                    onViewChange={onViewChange}
                    selectedPlatform={platform}
                    selectedCategory={category}
                    onPlatformChange={setPlatform}
                    onCategoryChange={setCategory}
                />
            </div>

            {/* Center Pane: Main Content / Canvas */}
            <div className="flex-1 min-w-0 relative z-10 bg-grid-pattern">
                {children}
            </div>

            {/* Right Pane: Properties & Context */}
            <div className="flex-none w-80 z-20">
                <PropertiesPanel />
            </div>
        </div>
    )
}
