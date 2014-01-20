( function(failrail, $, undefined) {

    }(window.failrail = window.failrail || {}, jQuery)); ( function(dataviz, $, undefined) {

        var dataSourceUrls = {
            "incidents" : "//docs.google.com/spreadsheet/tq?key=0AkdFf0ojY-LPdG52LWlpYU5kOG5USVpVbHAxMW5YSXc&headers=1&gid=0",
            "km" : "//docs.google.com/spreadsheet/tq?key=0AkdFf0ojY-LPdG52LWlpYU5kOG5USVpVbHAxMW5YSXc&headers=1&gid=14"
        };

        dataviz.charts = {};

        dataviz.charts.operatingKm = function() {
            var chart = new google.visualization.ChartWrapper({
                "containerId" : "operating-km",
                "chartType" : "AreaChart",
                "dataSourceUrl" : dataSourceUrls.km,
                "query" : "select A, C ",
                "options" : {
                    "title" : "SMRT - Total Car Kilometres Operated (to nearest million)",
                    'legend' : {
                        'position' : 'none'
                    },
                    "vAxis" : {
                        "title" : "",
                        "textPosition" : "in",
                        "textStyle" : {
                            "fontSize" : 14
                        }
                    },
                    "chartArea" : {
                        "width" : "100%",
                        "height" : "80%",
                        "top" : 20,
                        "left" : 0
                    },
                     "pointSize" : 8
                }
            });
            chart.draw();
        };

        dataviz.charts.delayHistogram = function(arg) {

            if (arg === "all lines yearly") {
                return allLinesYearly();
            } else {
                return query();
            }

            function allLinesYearly() {
                var chart = new google.visualization.ChartWrapper({
                    "containerId" : "delay-histogram-all-lines-yearly",
                    "chartType" : "ColumnChart",
                    "dataSourceUrl" : dataSourceUrls.incidents,
                    "query" : "select year(R), count(A) where G >= date '2012-01-01' and K != 'Others' and K != 'Person hit by train' and K != 'Maintenance/Upgrading' group by year(R) pivot AA order by year(R) label year(R) 'Year' format year(R) '####' ",
                    "options" : {
                        "title" : "Yearly Number of Incidents by Length of Delay",
                        'legend' : {
                            'position' : 'top'
                        },
                        "vAxis" : {
                            "title" : "",
                            "textPosition" : "in",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "chartArea" : {
                            "width" : "100%",
                            "height" : "70%",
                            "top" : 40,
                            "left" : 0
                        },
                        "focusTarget" : "category",
                        "colors" : ["#0066ff", "#009900", "#ff9900", "#ff3333"], // blue,green,orange,red
                        "isStacked" : false
                    }
                });
                chart.draw();
            }

            function query() {
                var query = new google.visualization.Query(dataSourceUrls.incidents);

                query.setQuery("select G, I, count(A) " + "where G >= date '2011-12-01' " + "and K != 'Others' and K != 'Person hit by train' " + "and K != 'Maintenance/Upgrading' " + "group by G, I " + "pivot AA " + // duration bin
                "order by G " + // in chronological order
                "label I 'Rail Line' " + ", G 'Date' " + ", count(A) '' " + "format G 'MMM yyyy', count(A) '###' ");
                query.send(dashboard);
            }

            function dashboard(response) {

                if (response.isError()) {
                    console.log("[dataviz.charts.delayHistogram] Error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                    return;
                }

                var dashboardId = "delay-histogram";
                var chartId = dashboardId + "-chart1";

                var lineControlId = dashboardId + "-control1";
                var data = response.getDataTable();
                var dashboard = new google.visualization.Dashboard(document.getElementById(dashboardId));
                var lineControl, chart = null;

                // Filter by rail line
                lineControl = new google.visualization.ControlWrapper({
                    'controlType' : 'CategoryFilter',
                    'containerId' : lineControlId,
                    'options' : {
                        'filterColumnLabel' : 'Rail Line',
                        'ui' : {
                            'labelStacking' : 'horizontal',
                            'allowTyping' : false,
                            'allowMultiple' : false
                        }
                    },
                    'state' : {
                        'selectedValues' : ['North-South Line']
                    }
                });

                chart = new google.visualization.ChartWrapper({
                    "chartType" : "ColumnChart",
                    "containerId" : chartId,
                    "options" : {
                        "title" : "Number of Service Disruptions by Length of Delay (month-on-month)",
                        "legend" : {
                            "position" : "top",
                            "alignment" : "left",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "chartArea" : {
                            "width" : "100%",
                            "height" : "80%",
                            "top" : 40,
                            "left" : 0
                        },
                        "vAxis" : {
                            "title" : "",
                            "textPosition" : "in",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "hAxis" : {
                            "title" : "",
                            "textPosition" : "out",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "focusTarget" : "category",
                        "colors" : ["#0066ff", "#009900", "#ff9900", "#ff3333"], // blue,green,orange,red
                        "isStacked" : true
                    }
                });
                chart.setView({
                    "columns" : [0, 2, 3, 4, 5]
                });

                dashboard.bind([lineControl], [chart]);

                dashboard.draw(data);
            }

        };

        dataviz.charts.monthlyIncidentsByCategory = function() {

            query();
            function query() {
                var query = new google.visualization.Query(dataSourceUrls.incidents);

                // Left truncate the data to begin Dec 2011
                query.setQuery("select G, I, count(A), sum(Q)/60 " + "where G >= date '2011-12-01' " + "and K != 'Others' and K != 'Person hit by train' " + "group by G, I " + "pivot K " + "order by G " + "label I 'Rail Line" + "', G 'Date" + "', count(A) '', sum(Q)/60 '' " + "format sum(Q)/60 '#.# hours', G 'MMM yyyy' ");
                query.send(dashboard);
            }

            function dashboard(response) {

                if (response.isError()) {
                    console.log("[dataviz.charts.monthlyIncidentsByCategory] Error: " + response.getMessage() + "\n" + response.getDetailedMessage());
                    return;
                }

                var dashboardId = "monthly-incidents-by-category";
                var categoryChartId = dashboardId + "-chart1";
                var delayChartId = dashboardId + "-chart2";
                var lineControlId = dashboardId + "-control1";
                var data = response.getDataTable();
                var dashboard = new google.visualization.Dashboard(document.getElementById(dashboardId));
                var lineControl, categoryChart, delayChart = null;

                // Filter by rail line
                lineControl = new google.visualization.ControlWrapper({
                    'controlType' : 'CategoryFilter',
                    'containerId' : lineControlId,
                    'options' : {
                        'filterColumnLabel' : 'Rail Line',
                        'ui' : {
                            'labelStacking' : 'horizontal',
                            'allowTyping' : false,
                            'allowMultiple' : false
                        }
                    },
                    'state' : {
                        'selectedValues' : ['North-South Line']
                    }
                });

                // Number of service disruptions by category (month-on-month)
                categoryChart = new google.visualization.ChartWrapper({
                    "chartType" : "ColumnChart",
                    "containerId" : categoryChartId,
                    "options" : {
                        "title" : "Number of Service Disruptions by Category (month-on-month)",
                        "legend" : {
                            "position" : "top",
                            "textStyle" : {
                                "fontSize" : 12
                            }
                        },
                        "vAxis" : {
                            "format" : "#",
                            "textPosition" : "in",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "hAxis" : {
                            "format" : "",
                            "textPosition" : "out",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "chartArea" : {
                            "width" : "100%",
                            "height" : "80%",
                            "left" : 0,
                            "top" : 45
                        },
                        "focusTarget" : "category",
                        "bar" : {
                            "groupWidth" : "45%"
                        },
                        "isStacked" : true
                    }
                });
                categoryChart.setView({
                    "columns" : [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
                });

                // Total delay hours by category (month-on-month)
                delayChart = new google.visualization.ChartWrapper({
                    "chartType" : "ColumnChart",
                    "containerId" : delayChartId,
                    "options" : {
                        "title" : "Delay Hours by Category (month-on-month)",
                        "legend" : {
                            "position" : "top",
                            "textStyle" : {
                                "fontSize" : 12
                            }
                        },
                        "vAxis" : {
                            "format" : "#.# hrs",
                            "textPosition" : "in",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "hAxis" : {
                            "format" : "",
                            "textPosition" : "out",
                            "textStyle" : {
                                "fontSize" : 14
                            }
                        },
                        "chartArea" : {
                            "width" : "100%",
                            "height" : "80%",
                            "left" : 0,
                            "top" : 45
                        },
                        "focusTarget" : "category",
                        "bar" : {
                            "groupWidth" : "45%"
                        },
                        "isStacked" : true
                    }
                });
                delayChart.setView({
                    "columns" : [0, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
                });
                dashboard.bind([lineControl], [categoryChart, delayChart]);

                dashboard.draw(data);
            }

        };

    }(window.failrail.dataviz = window.failrail.dataviz || {}, jQuery));
