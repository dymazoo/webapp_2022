/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id      : 'dashboard',
        title   : 'Dashboard',
        subtitle: 'Dashboard',
        type    : 'basic',
        icon    : 'heroicons_outline:adjustments',
        link : '/dashboard'
    },
    {
        id      : 'marketing',
        title   : 'Marketing',
        subtitle: 'Segmentation and marketing tasks',
        type    : 'group',
        icon    : 'heroicons_outline:globe-alt',
        children: [
            {
                id   : 'marketing.segmentation',
                title: 'Segmentation',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:chart-pie',
                link : '/marketing/segmentation'
            }
//            {
//                id   : 'marketing.campaigns',
//                title: 'Campaigns',
//                type : 'basic',
//                disabled : true,
//                icon : 'heroicons_outline:mail',
//                link : '/marketing/campaigns',
//                badge: {
//                    title  : '27',
//                    classes: 'px-2 bg-pink-600 text-white rounded-full'
//                }
//            }
        ]
    },
    {
        id      : 'data',
        title   : 'Data management',
        subtitle: 'Import, manage and handle compliance',
        type    : 'group',
        icon    : 'heroicons_outline:database',
        children: [
            {
                id   : 'data.import',
                title: 'Import',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:cloud-upload',
                link : '/data/import'
            },
            {
                id   : 'data.layout',
                title: 'Layouts',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:table',
                link : '/data/layouts'
            },
//            {
//                id   : 'data.custom-fields',
//                title: 'Custom fields',
//                type : 'basic',
//                disabled : true,
//                icon : 'heroicons_outline:dots-circle-horizontal',
//                link : '/data/custom-fields'
//            },
            {
                id   : 'data.sales-categories',
                title: 'Sales categories',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:shopping-cart',
                link : '/data/sales-categories'
            },
            {
                id   : 'data.event-categories',
                title: 'Event categories',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:qrcode',
                link : '/data/event-categories'
            },
            {
                id   : 'data.events',
                title: 'Events',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:calendar',
                link : '/data/events'
            },
            {
                id   : 'data.custom-fields',
                title: 'Custom Fields',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:collection',
                link : '/data/custom-fields'
            },
            {
                id   : 'data.preferences',
                title: 'Dashboard Preferences',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:cog',
                link : '/data/preferences'
            },
            {
                id   : 'data.compliance',
                title: 'Compliance',
                type : 'basic',
                disabled : true,
                icon : 'heroicons_outline:check-circle',
                link : '/data/compliance'
            }
        ]
    },
    {
        id      : 'integrations',
        title   : 'Integrations',
        subtitle: 'Data from everywhere',
        type    : 'group',
        icon    : 'heroicons_outline:view-grid-add',
        children: []
    }
];

export const compactNavigation: FuseNavigationItem[] = [
    {
        id      : 'dashboard',
        title   : 'Dashboard',
        tooltip : 'Dashboard',
        type    : 'basic',
        icon    : 'heroicons_outline:adjustments',
        link : '/dashboard'
    },
    {
        id      : 'marketing',
        title   : 'Marketing',
        tooltip : 'Segmentation and marketing tasks',
        type    : 'aside',
        icon    : 'heroicons_outline:globe-alt',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'data',
        title   : 'Data management',
        tooltip : 'Import, manage and handle compliance',
        type    : 'aside',
        icon    : 'heroicons_outline:database',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'integrations',
        title   : 'Integrations',
        tooltip : 'Data from everywhere',
        type    : 'aside',
        icon    : 'heroicons_outline:view-grid-add',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id      : 'dashboard',
        title   : 'DASHBOARD',
        type    : 'basic',
        link : '/dashboard'
    },
    {
        id      : 'marketing',
        title   : 'MARKETING',
        type    : 'group',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id   : 'data',
        title: 'DATA MANAGEMENT',
        type : 'group'
    },
    {
        id      : 'integrations',
        title   : 'INTEGRATIONS',
        type    : 'group',
        icon    : 'heroicons_outline:view-grid-add',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id      : 'dashboard',
        title   : 'Dashboard',
        type    : 'basic',
        icon    : 'heroicons_outline:adjustments',
        link : '/dashboard'
    },
    {
        id      : 'marketing',
        title   : 'Marketing',
        type    : 'group',
        icon    : 'heroicons_outline:globe-alt',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'data',
        title   : 'Data management',
        type    : 'group',
        icon    : 'heroicons_outline:database',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
    {
        id      : 'integrations',
        title   : 'Integrations',
        type    : 'group',
        icon    : 'heroicons_outline:view-grid-add',
        children: [] // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    },
];
