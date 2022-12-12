import {Component, OnInit, LOCALE_ID, Inject, OnDestroy} from '@angular/core';
import {FuseConfigService} from '@fuse/services/config';
import {HttpService} from 'app/shared/services/http.service';
import {TranslocoService} from '@ngneat/transloco';
import {formatDate} from '@angular/common';
import { ApexOptions } from 'ng-apexcharts';
import {Subject, Subscription} from 'rxjs';
import {clone} from 'lodash-es';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

    public dashboardData;
    public dashboardSubscription: Subscription;

    public settings;
    public dashboardDates: string[] = [];
    public currentDate: string;
    public dateItem: any;
    public showCharts: string[] = [];
    public settingList: any = {};
    public emptyDashboard: boolean = false;
    public dataReady: boolean = false;

    public chartPeople: ApexOptions;
    public chartSales: ApexOptions;
    public chartEvents: ApexOptions;
    public chartSent: ApexOptions;
    public chartOpen: ApexOptions;
    public chartClick: ApexOptions;
    public chartUnsubscribe: ApexOptions;
    public chartBounce: ApexOptions;

    public peopleData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'People', 'data':[]}]};
    public salesData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Sales', 'data':[]}]};
    public eventsData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Event Actions', 'data':[]}]};
    public sentData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Sent', 'data':[]}]};
    public openData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Open', 'data':[]}]};
    public clickData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Click', 'data':[]}]};
    public unsubscribeData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Unsubscribe', 'data':[]}]};
    public bounceData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Bounce', 'data':[]}]};

    public allChartData = [];
    public chartAll = [];

    public dateLabels: Array<any> = ['Ready'];

    config: any;

    private processingDashboard: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _fuseConfigService: FuseConfigService,
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        @Inject(LOCALE_ID) protected locale: string
    ) {
    }

    ngOnInit(): void {
        this.dashboardData = this.httpService.fetchDashboardData(false);
        if (this.dashboardData !== undefined) {
            this.processDashboardData(false);
        }

        this.dashboardSubscription = this.httpService.getDashboardData().subscribe(dashboardData => {
            this.dashboardData = dashboardData;
            this.processDashboardData(true);
        });
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    public onDateSelect(value): void {
        this.refreshDashboard(value);
    }

    public forceRefreshDashboard(): void {
        this.dashboardData = this.httpService.fetchDashboardData(true);
    }

    protected processDashboardData(force: boolean): void {
        this.dataReady = false;
        if (this.processingDashboard) {
            return;
        }
        this.processingDashboard = true;

        const storedDashboard = this.httpService.getStoredDashboard();
        if (!storedDashboard || !storedDashboard.hasData) {
            this.emptyDashboard = true;
        }
        if (!force && storedDashboard && storedDashboard.hasData) {
            this.emptyDashboard = false;
            this.peopleData = storedDashboard.peopleData;
            this.salesData = storedDashboard.salesData;
            this.eventsData = storedDashboard.eventsData;
            this.sentData = storedDashboard.sentData;
            this.openData = storedDashboard.openData;
            this.clickData = storedDashboard.clickData;
            this.unsubscribeData = storedDashboard.unsubscribeData;
            this.bounceData = storedDashboard.bounceData;
            this.allChartData = storedDashboard.allChartData;
            this.showCharts = storedDashboard.showCharts;
            this.dashboardDates = storedDashboard.dashboardDates;
            this.dateItem = storedDashboard.dateItem;
            this.settingList = storedDashboard.settingList;
            this.refreshDashboard(this.dateItem.value);
        } else {
            if (!this.dashboardData || !this.dashboardData.hasData) {
                this.emptyDashboard = true;
                this.processingDashboard = false;
            } else {
                this.emptyDashboard = false;

                this.allChartData = [];
                this.chartAll = [];
                this.showCharts = [];

                if (this.dashboardData.Summary) {
                    this.peopleData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Total Profiles', 'data': []}]
                    };
                    this.salesData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Sales', 'data': []}]
                    };
                    this.eventsData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Event Transactions', 'data': []}]
                    };
                    this.sentData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Sent', 'data': []}]
                    };
                    this.openData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Opened', 'data': []}]
                    };
                    this.clickData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Clicked', 'data': []}]
                    };
                    this.unsubscribeData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Unsubscribed', 'data': []}]
                    };
                    this.bounceData = {
                        'amount': -1,
                        'trend': -1,
                        'labels': [],
                        'series': [{'name': 'Bounced', 'data': []}]
                    };

                    this.dateLabels = [];

                    let summaryData = this.dashboardData.Summary;
                    let summaryDates = [];
                    let salesData = [];
                    let eventsData = [];
                    let sentData = [];
                    let openData = [];
                    let clickData = [];
                    let unsubscribeData = [];
                    let bounceData = [];
                    summaryData.dates.forEach((dateItem) => {
                        summaryDates.push({
                            value: dateItem.date,
                            label: formatDate(dateItem.date, 'longDate', this.locale)
                        });
                        this.dateLabels.unshift(formatDate(dateItem.date, 'longDate', this.locale));
                        dateItem.data.forEach((dataItem) => {
                            if (dataItem.label === 'people') {
                                if (this.peopleData.amount === -1) {
                                    this.peopleData.amount = dataItem.value;
                                } else {
                                    if (this.peopleData.trend === -1) {
                                        this.peopleData.trend = this.peopleData.amount - dataItem.value;
                                    }
                                }
                                this.peopleData.labels.unshift(dateItem.date);
                                this.peopleData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'sales') {
                                if (this.salesData.amount === -1) {
                                    this.salesData.amount = dataItem.value;
                                } else {
                                    if (this.salesData.trend === -1) {
                                        this.salesData.trend = this.salesData.amount - dataItem.value;
                                    }
                                }
                                this.salesData.labels.unshift(dateItem.date);
                                this.salesData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'events') {
                                if (this.eventsData.amount === -1) {
                                    this.eventsData.amount = dataItem.value;
                                } else {
                                    if (this.eventsData.trend === -1) {
                                        this.eventsData.trend = this.eventsData.amount - dataItem.value;
                                    }
                                }
                                this.eventsData.labels.unshift(dateItem.date);
                                this.eventsData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'sent') {
                                if (this.sentData.amount === -1) {
                                    this.sentData.amount = dataItem.value;
                                } else {
                                    if (this.sentData.trend === -1) {
                                        this.sentData.trend = this.sentData.amount - dataItem.value;
                                    }
                                }
                                this.sentData.labels.unshift(dateItem.date);
                                this.sentData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'open') {
                                if (this.openData.amount === -1) {
                                    this.openData.amount = dataItem.value;
                                } else {
                                    if (this.openData.trend === -1) {
                                        this.openData.trend = this.openData.amount - dataItem.value;
                                    }
                                }
                                this.openData.labels.unshift(dateItem.date);
                                this.openData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'click') {
                                if (this.clickData.amount === -1) {
                                    this.clickData.amount = dataItem.value;
                                } else {
                                    if (this.clickData.trend === -1) {
                                        this.clickData.trend = this.clickData.amount - dataItem.value;
                                    }
                                }
                                this.clickData.labels.unshift(dateItem.date);
                                this.clickData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'unsubscribe') {
                                if (this.unsubscribeData.amount === -1) {
                                    this.unsubscribeData.amount = dataItem.value;
                                } else {
                                    if (this.unsubscribeData.trend === -1) {
                                        this.unsubscribeData.trend = this.unsubscribeData.amount - dataItem.value;
                                    }
                                }
                                this.unsubscribeData.labels.unshift(dateItem.date);
                                this.unsubscribeData.series[0].data.unshift(dataItem.value);
                            }
                            if (dataItem.label === 'bounce') {
                                if (this.bounceData.amount === -1) {
                                    this.bounceData.amount = dataItem.value;
                                } else {
                                    if (this.bounceData.trend === -1) {
                                        this.bounceData.trend = this.bounceData.amount - dataItem.value;
                                    }
                                }
                                this.bounceData.labels.unshift(dateItem.date);
                                this.bounceData.series[0].data.unshift(dataItem.value);
                            }
                        });
                    });
                    this.dashboardDates = summaryDates;
                    if (this.peopleData.amount === -1) {
                        this.peopleData.amount = 0;
                    }
                    if (this.peopleData.trend === -1) {
                        this.peopleData.trend = 0;
                    }
                    if (this.salesData.amount === -1) {
                        this.salesData.amount = 0;
                    }
                    if (this.salesData.trend === -1) {
                        this.salesData.trend = 0;
                    }
                    if (this.eventsData.amount === -1) {
                        this.eventsData.amount = 0;
                    }
                    if (this.eventsData.trend === -1) {
                        this.eventsData.trend = 0;
                    }
                    if (this.sentData.amount === -1) {
                        this.sentData.amount = 0;
                    }
                    if (this.sentData.trend === -1) {
                        this.sentData.trend = 0;
                    }
                    if (this.openData.amount === -1) {
                        this.openData.amount = 0;
                    }
                    if (this.openData.trend === -1) {
                        this.openData.trend = 0;
                    }
                    if (this.clickData.amount === -1) {
                        this.clickData.amount = 0;
                    }
                    if (this.clickData.trend === -1) {
                        this.clickData.trend = 0;
                    }
                    if (this.unsubscribeData.amount === -1) {
                        this.unsubscribeData.amount = 0;
                    }
                    if (this.unsubscribeData.trend === -1) {
                        this.unsubscribeData.trend = 0;
                    }
                    if (this.bounceData.amount === -1) {
                        this.bounceData.amount = 0;
                    }
                    if (this.bounceData.trend === -1) {
                        this.bounceData.trend = 0;
                    }
                }

                this.dateItem = clone(this.dashboardDates[0]);
                if (this.dateItem) {
                    this.currentDate = this.dateItem.value;
                    this.httpService.getEntity('settings', '')
                        .subscribe(result => {
                            this.settings = result;
                            let type;
                            this.settings.forEach(setting => {
                                if (setting.name.substr(0, 9) === 'dashboard') {
                                    type = setting.name.substr(10);
                                    if (setting.value === '1') {
                                        this.showCharts.push(setting.label);
                                        this.settingList[setting.label] = setting;
                                    }
                                }
                            });

                            this.refreshDashboard(this.dateItem.value);
                        }, (errors) => {
                            this.processingDashboard = false;
                        });
                }
            }
        }
    }

    protected refreshDashboard(dashboardDate): void {
        this.processingDashboard = false;
        this.chartPeople = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#38BDF8'],
            fill   : {
                colors : ['#38BDF8'],
                opacity: 0.5
            },
            series : this.peopleData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.peopleData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartSent = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#F6AD55'],
            fill   : {
                colors : ['#F6AD55'],
                opacity: 0.5
            },
            series : this.sentData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.sentData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartOpen = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#d97e41'],
            fill   : {
                colors : ['#d97e41'],
                opacity: 0.5
            },
            series : this.openData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.openData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartClick = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#5562f6'],
            fill   : {
                colors : ['#5562f6'],
                opacity: 0.5
            },
            series : this.clickData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.clickData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartUnsubscribe = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#f6557b'],
            fill   : {
                colors : ['#f6557b'],
                opacity: 0.5
            },
            series : this.unsubscribeData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.unsubscribeData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartBounce = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#e1f655'],
            fill   : {
                colors : ['#e1f655'],
                opacity: 0.5
            },
            series : this.bounceData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.bounceData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartSales = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#34D399'],
            fill   : {
                colors : ['#34D399'],
                opacity: 0.5
            },
            series : this.salesData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.salesData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        this.chartEvents = {
            chart  : {
                animations: {
                    enabled: true
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'area',
                sparkline : {
                    enabled: true
                }
            },
            colors : ['#FB7185'],
            fill   : {
                colors : ['#FB7185'],
                opacity: 0.5
            },
            series : this.eventsData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.eventsData.labels
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => val.toString()
                }
            }
        };

        const chartColours = [
          ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
          ['#3F51B5', '#03A9F4', '#4CAF50', '#F9CE1D', '#FF9800'],
          ['#33B2DF', '#546E7A', '#D4526E', '#13D8AA', '#A5978B'],
          ['#4ECDC4', '#C7F464', '#81D4FA', '#546E7A', '#FD6A6A'],
          ['#2B908F', '#F9A3A4', '#90EE7E', '#FA4443', '#69D2E7'],
          ['#449DD1', '#F86624', '#EA3546', '#662E9B', '#C5D86D'],
          ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#E2C044'],
          ['#662E9B', '#F86624', '#F9C80E', '#EA3546', '#43BCCD'],
          ['#5C4742', '#A5978B', '#8D5B4C', '#5A2A27', '#C4BBAF'],
          ['#A300D6', '#7D02EB', '#5653FE', '#2983FF', '#00B1F2'],
        ];
        let dataSet;
        let chartType;
        let currentPallete = 0;
        let totalDateCount = 0;
        let dataLabel = '';
        let title = '';
        this.showCharts.forEach(key => {
            if (this.dashboardData[key]) {
                dataSet = this.dashboardData[key];
                chartType = this.settingList[key].type;
                title = this.settingList[key].label;
                if (title === 'City') {
                    title = 'Top Towns / Citys';
                }
                if (title === 'County') {
                    title = 'Top States / Counties / Provinces';
                }
                if (title === 'Country') {
                    title = 'Top Countries';
                }
                if (chartType === 'donut') {
                    this.allChartData[key] = {'title': title, 'type': chartType, 'total': 0, 'series': [], 'labels': []};
                }
                if (chartType === 'bar') {
                    this.allChartData[key] = {'title': title, 'type': chartType, 'total': 0,
                        'series': [{'name': this.settingList[key].label, 'data': []}], 'labels': []};
                }
                if (chartType === 'line') {
                    this.allChartData[key] = {'title': title, 'type': chartType, 'total': 0,
                        'series': [], 'labels': []};
                }
                const lineLabels = {};
                const dataSeries = {};
                dataSet.dates.forEach((dateItem) => {
                    if (chartType === 'line') {
                        dateItem.data.forEach((dataElement) => {
                            if (dataElement.label) {
                                dataLabel = dataElement.label.charAt(0).toUpperCase() + dataElement.label.slice(1);
                                if (!lineLabels[dateItem.date]) {
                                    lineLabels[dateItem.date] = dateItem.date;
                                }
                                if (!dataSeries[dataLabel]) {
                                    dataSeries[dataLabel] = {'name': dataLabel, 'data': []};
                                }
                                dataSeries[dataLabel].data.unshift(dataElement.value);
                            }
                        });
                    }
                    if (chartType === 'donut' || chartType === 'bar') {
                        if (dateItem.date === dashboardDate) {
                            totalDateCount = 0;
                            dateItem.data.forEach((dataElement) => {
                                totalDateCount = totalDateCount + dataElement.value;
                                if (dataElement.label) {
                                    dataLabel = dataElement.label.charAt(0).toUpperCase() + dataElement.label.slice(1);
                                    if (chartType === 'donut') {
                                        this.allChartData[key].labels.push(dataLabel);
                                        this.allChartData[key].series.push(dataElement.value);
                                    }
                                    if (chartType === 'bar') {
                                        this.allChartData[key].labels.push(dataLabel);
                                        this.allChartData[key].series[0].data.push(dataElement.value);
                                    }
                                }
                            });
                            this.allChartData[key].total = totalDateCount;

                            if (chartType === 'donut') {
                                this.allChartData[key].series.forEach((value, index) => {
                                    this.allChartData[key].series[index] = parseFloat((value / totalDateCount * 100).toFixed(2));
                                });
                                this.chartAll[key] = {
                                    chart: {
                                        animations: {
                                            speed: 400,
                                            animateGradually: {
                                                enabled: false
                                            }
                                        },
                                        fontFamily: 'inherit',
                                        foreColor: 'inherit',
                                        height: '100%',
                                        type: 'donut',
                                        sparkline: {
                                            enabled: true
                                        }
                                    },
                                    colors: chartColours[currentPallete],
                                    labels: this.allChartData[key].labels,
                                    plotOptions: {
                                        pie: {
                                            customScale: 0.9,
                                            expandOnClick: false,
                                            donut: {
                                                size: '70%'
                                            }
                                        }
                                    },
                                    series: this.allChartData[key].series,
                                    states: {
                                        hover: {
                                            filter: {
                                                type: 'none'
                                            }
                                        },
                                        active: {
                                            filter: {
                                                type: 'none'
                                            }
                                        }
                                    },
                                    tooltip: {
                                        enabled: true,
                                        fillSeriesColor: false,
                                        theme: 'dark',
                                        custom: ({
                                                     seriesIndex,
                                                     w
                                                 }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                                             <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                                             <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                                             <div class="ml-2 text-md font-bold leading-none">${w.config.series[seriesIndex]}%</div>
                                                         </div>`
                                    }
                                };
                            }
                            if (chartType === 'bar') {
                                this.chartAll[key] = {
                                    chart: {
                                        animations: {
                                            enabled: true
                                        },
                                        fontFamily: 'inherit',
                                        foreColor: 'inherit',
                                        height: '100%',
                                        type: 'bar',
                                        toolbar: {
                                            show: false
                                        },
                                        zoom: {
                                            enabled: false
                                        }
                                    },
                                    dataLabels: {
                                        enabled: false,
                                    },
                                    colors: chartColours[currentPallete],
                                    fill: {
                                        opacity: 1
                                    },
                                    grid: {
                                        borderColor: 'var(--fuse-border)'
                                    },
                                    legend: {
                                        show: false
                                    },
                                    plotOptions: {
                                        bar: {
                                            columnWidth: '50%',
                                            distributed: true
                                        }
                                    },
                                    series: this.allChartData[key].series,
                                    states: {
                                        hover: {
                                            filter: {
                                                type: 'darken',
                                                value: 0.75
                                            }
                                        }
                                    },
                                    stroke: {
                                        show: true,
                                        width: 2,
                                        colors: ['transparent']
                                    },
                                    tooltip: {
                                        followCursor: true,
                                        theme: 'dark'
                                    },
                                    xaxis: {
                                        categories: this.allChartData[key].labels,
                                        axisBorder: {
                                            show: false
                                        },
                                        labels: {
                                            style: {
                                                colors: 'var(--fuse-text-secondary)'
                                            }
                                        }
                                    },
                                    yaxis: {
                                        labels: {
                                            offsetX: -5,
                                            style: {
                                                colors: 'var(--fuse-text-secondary)'
                                            }
                                        }
                                    }
                                };
                            }
                            currentPallete++;
                            if (currentPallete > 9) {
                                currentPallete = 0;
                            }
                        }
                    }
                });
                if (chartType === 'line') {
                    Object.keys(lineLabels).forEach(lineKey => {
                        this.allChartData[key].labels.unshift(lineLabels[lineKey]);
                    });
                    Object.keys(dataSeries).forEach(dataKey => {
                        this.allChartData[key].series.push(dataSeries[dataKey]);
                    });

                    this.chartAll[key] = {
                        chart  : {
                            animations: {
                                enabled: true
                            },
                            fontFamily: 'inherit',
                            foreColor : 'inherit',
                            height    : '100%',
                            type      : 'line',
                            toolbar: {
                                show: false
                            },
                            zoom: {
                                enabled: false
                            }
                        },
                        series : this.allChartData[key].series,
                        colors: chartColours[currentPallete],
                        tooltip: {
                            followCursor: true,
                            theme       : 'dark'
                        },
                        stroke : {
                            curve: 'smooth'
                        },
                        xaxis  : {
                            type      : 'category',
                            categories:  this.allChartData[key].labels,
                            labels: {
                                style: {
                                    colors: 'var(--fuse-text-secondary)'
                                }
                            }
                        },
                        yaxis  : {
                            labels: {
                                formatter: (val): string => val.toString()
                            }
                        }
                    };
                    currentPallete++;
                    if (currentPallete > 9) {
                        currentPallete = 0;
                    }
                }
            }
        });

        const storedDashboard = {
            'peopleData': this.peopleData, 'salesData': this.salesData, 'eventsData': this.eventsData,
            'sentData': this.sentData, 'openData': this.openData, 'clickData': this.clickData, 'unsubscribeData': this.unsubscribeData,
            'bounceData': this.bounceData, 'allChartData': this.allChartData, 'showCharts': this.showCharts,
            'dateItem': this.dateItem, 'hasData': true, 'dashboardDates': this.dashboardDates,
            'settingList': this.settingList
        };
        this.httpService.storeDashboard(storedDashboard);
        this.dataReady = true;
    }

}
