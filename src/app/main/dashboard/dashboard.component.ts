import {Component, OnInit, LOCALE_ID, Inject} from '@angular/core';
import {FuseConfigService} from '@fuse/services/config';
import {HttpService} from 'app/shared/services/http.service';
import {TranslocoService} from '@ngneat/transloco';
import {formatDate} from '@angular/common';
import { ApexOptions } from 'ng-apexcharts';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

    public dashboardData;
    public settings;
    public dashboardDates: string[] = [];
    public currentDate: string;
    public dateItem: any;
    public showCharts: string[] = [];
    public settingList: any = {};
    public showCity: boolean = false;
    public showCountry: boolean = false;
    public emptyDashboard: boolean = false;
    public dataReady: boolean = false;

    public chartPeople: ApexOptions;
    public chartSales: ApexOptions;
    public chartEvents: ApexOptions;
    public chartActions: ApexOptions;

    public peopleData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'People', 'data':[]}]};
    public salesData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Sales', 'data':[]}]};
    public eventsData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Events', 'data':[]}]};
    public actionsData = {'amount': -1, 'trend': -1, 'labels' : [], 'series' : [{'name': 'Actions', 'data':[]}]};

    public allChartData = [];
    public chartAll = [];

    public dateLabels: Array<any> = ['Ready'];

    config: any;

    constructor(
        private _fuseConfigService: FuseConfigService,
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        @Inject(LOCALE_ID) protected locale: string
    ) {
    }

    ngOnInit(): void {

        this.httpService.getEntity('dashboard', '')
            .subscribe(result => {
                this.dashboardData = result;


                if (!this.dashboardData.hasData) {
                    this.emptyDashboard = true;
                }

                if (this.dashboardData.Summary) {
                    this.dateLabels.length = 0;

                    let summaryData = this.dashboardData.Summary;
                    let summaryDates = [];
                    let salesData = [];
                    let eventsData = [];
                    let actionsData = [];
                    summaryData.dates.forEach((dateItem) => {
                        summaryDates.push({value: dateItem.date, label: formatDate(dateItem.date, 'longDate', this.locale)});
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
                            if (dataItem.label === 'actions') {
                                if (this.actionsData.amount === -1) {
                                    this.actionsData.amount = dataItem.value;
                                } else {
                                    if (this.actionsData.trend === -1) {
                                        this.actionsData.trend = this.actionsData.amount - dataItem.value;
                                    }
                                }
                                this.actionsData.labels.unshift(dateItem.date);
                                this.actionsData.series[0].data.unshift(dataItem.value);
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
                }

                this.dateItem = this.dashboardDates[0];
                if (this.dateItem) {
                    this.currentDate = this.dateItem.value;
                    this.httpService.getEntity('settings', '')
                        .subscribe(result => {
                            this.settings = result;
                            let type;
                            this.settings.forEach(setting => {
                                if (setting.name.substr(0, 9) == 'dashboard') {
                                    type = setting.name.substr(10);
                                    if (setting.value === "1") {
                                        if (type === 'city') {
                                            this.showCity = true;
                                        } else {
                                            if (type === 'country') {
                                                this.showCountry = true;
                                            } else {
                                                this.showCharts.push(setting.label);
                                                this.settingList[setting.label] = setting;
                                            }
                                        }
                                    }
                                }
                            });

                            this.refreshDashboard(this.dateItem);
                        }, (errors) => {

                        });
                }
            }, (errors) => {
            });
    }

    public onDateSelect(item): void {
        this.refreshDashboard(item);
    }

    protected refreshDashboard(dashboardDate): void {
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

        this.chartActions = {
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
            series : this.actionsData.series,
            stroke : {
                curve: 'smooth'
            },
            tooltip: {
                followCursor: true,
                theme       : 'dark'
            },
            xaxis  : {
                type      : 'category',
                categories: this.actionsData.labels
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

        const donutColours = [
            ['#51f5f1' ,'#41cbc8', '#319795', '#2b736d', '#1B4945FF'],
            ['#9cccf8', '#6ca4d9', '#4280bb', '#2f6b96', '#2f5672'],
            ['#f5c19f', '#f1a26e', '#d97e41', '#f58c0d', '#835c2d'],
            ['#c0a9f5', '#ae90f1', '#805AD5', '#6131b4', '#9465e7']
        ];
        const lineColours = [
            '#41cbc8',
            '#6ca4d9',
            '#f1a26e',
            '#ae90f1'
        ];
        let dataSet;
        let chartType;
        let currentDonut = 0;
        let currentLine = 0;
        let totalDateCount = 0;
        let dataLabel = '';
        let title = '';
        Object.keys(this.dashboardData).forEach(key => {
            if (this.showCharts.indexOf(key) > -1) {
                dataSet = this.dashboardData[key];
                chartType = this.settingList[key].type;
                title = this.settingList[key].label;
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
                        if (dateItem.date === dashboardDate.value) {
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
                                    colors: donutColours[currentDonut],
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
                                currentDonut++;
                                if (currentDonut > 3) {
                                    currentDonut = 0;
                                }
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
                        }
                    }
                });
                if (chartType === 'line') {
                    Object.keys(lineLabels).forEach(lineKey => {
                        this.allChartData[key].labels.unshift(lineLabels[lineKey]);
                    });
                    Object.keys(dataSeries).forEach(dataKey => {
                        this.allChartData[key].series.unshift(dataSeries[dataKey]);
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
                        tooltip: {
                            followCursor: true,
                            theme       : 'dark'
                        },
                        stroke : {
                            curve: 'smooth'
                        },
                        xaxis  : {
                            type      : 'category',
                            categories:  this.allChartData[key].labels
                        },
                        yaxis  : {
                            labels: {
                                formatter: (val): string => val.toString()
                            }
                        }
                    };
                    currentLine++;
                    if (currentLine > 3) {
                        currentLine = 0;
                    }
                }
            }
        });

        this.dataReady = true;
    }

}
