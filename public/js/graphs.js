(function() {
    const chartColors = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
    };

    var baseTime = 0;
    var timeCompensation = 0;
    var pauseTime = 0;

    require('concert').on("run", function() {
            if (pauseTime) {
                timeCompensation += Date.now() - pauseTime;
                pauseTime = 0;
            }

            if (!baseTime) {
                baseTime = Date.now();
            }
        })
        .on("pause", function() {
            pauseTime = Date.now();
        })
        .on("reset", function() {
            baseTime = pauseTime = Date.now();
            timeCompensation = 0;
        });

    var writeDataPoint = function(chart, datasetIndex, tVal, yVal) {
        chart.data.datasets[datasetIndex].data.push({
            t: tVal,
            y: yVal
        });
    };

    // RESOURCES

    var getResourcesConfig = function() {
        return {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Food',
                    backgroundColor: chartColors.green,
                    borderColor: chartColors.green,
                    data: [],
                    fill: false,
                }, {
                    label: 'Silver',
                    backgroundColor: chartColors.grey,
                    borderColor: chartColors.grey,
                    data: [],
                    fill: false,
                }, {
                    label: 'Water',
                    backgroundColor: chartColors.blue,
                    borderColor: chartColors.blue,
                    data: [],
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Resources'
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
	                        displayFormats: {
		                        millisecond: 's',
		                        second: 's',
		                        minute: 'mm:s',
		                        hour: 'mm:s',
		                        day: 'mm:s',
		                        week: 'mm:s',
		                        year: 'mm:s',
	                        }
                        },
                        scaleLabel: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Quantity'
                        }
                    }]
                }
            }
        };
    };

    var resourcesChart = new Chart(document.getElementById('graph_resources').getContext('2d'), getResourcesConfig());
    var resourcesChartUpdated = false;

    var resources = {food: 0, silver: 0, water: 0};
    var resourcesSnapshot = {food: 0, silver: 0, water: 0};
    var addResources = function(type, quantity) {
        resources[type] += quantity;
    };

    Food.prototype.on('created', function(food) {
        addResources('food', food.quantity);
    }).on('collected', function(quantity) {
        addResources('food', -quantity);
    });
    Silver.prototype.on('created', function(silver) {
        addResources('silver', silver.quantity);
    }).on('collected', function(quantity) {
        addResources('silver', -quantity);
    });
    Water.prototype.on('created', function(water) {
        addResources('water', water.quantity);
    }).on('collected', function(quantity) {
        addResources('water', -quantity);
    });
    require('concert').on("reset", function() {
        resources.food = 0;
        resources.silver = 0;
        resources.water = 0;

        resourcesChart.data.datasets.forEach(dataset => {
            dataset.data.splice(0, dataset.data.length);
        });
    });
    setInterval(function() {
        var tVal = Date.now() - baseTime - timeCompensation;

        if (resources.food !== resourcesSnapshot.food) {
            if (resourcesChart.data.datasets[0].data.length) {
                writeDataPoint(resourcesChart, 0, tVal, resources.food);
            } else {
                writeDataPoint(resourcesChart, 0, 0, resources.food);
            }
            resourcesSnapshot.food = resources.food;
            resourcesChartUpdated = true;
        }
        if (resources.silver !== resourcesSnapshot.silver) {
            if (resourcesChart.data.datasets[1].data.length) {
                writeDataPoint(resourcesChart, 1, tVal, resources.silver);
            } else {
                writeDataPoint(resourcesChart, 1, 0, resources.silver);
            }
            resourcesSnapshot.silver = resources.silver;
            resourcesChartUpdated = true;
        }
        if (resources.water !== resourcesSnapshot.water) {
            if (resourcesChart.data.datasets[2].data.length) {
                writeDataPoint(resourcesChart, 2, tVal, resources.water);
            } else {
                writeDataPoint(resourcesChart, 2, 0, resources.water);
            }
            resourcesSnapshot.water = resources.water;
            resourcesChartUpdated = true;
        }
    }, 100);

    // TRIBES

    var getTribesConfig = function() {
        return {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Tribes',
                    backgroundColor: chartColors.red,
                    borderColor: chartColors.red,
                    yAxisID: 1,
                    data: [],
                    fill: false,
                }, {
                    label: 'Size',
                    backgroundColor: chartColors.yellow,
                    borderColor: chartColors.yellow,
                    yAxisID: 2,
                    data: [],
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Tribes'
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
	                        displayFormats: {
		                        millisecond: 's',
		                        second: 's',
		                        minute: 'mm:s',
		                        hour: 'mm:s',
		                        day: 'mm:s',
		                        week: 'mm:s',
		                        year: 'mm:s',
	                        }
                        },
                        scaleLabel: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        id: 1,
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            min: 0
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Tribes'
                        }
                    }, {
                        id: 2,
                        type: 'linear',
                        position: 'right',
                        scaleLabel: {
                            display: true,
                            labelString: 'Size'
                        }
                    }]
                }
            }
        };
    };

    var tribesChart = new Chart(document.getElementById('graph_tribes').getContext('2d'), getTribesConfig());
    var tribesChartUpdated = false;

    var tribes = {number: 0, size: 0};
    var tribesSnapshot = {number: 0, size: 0};

    Tribe.prototype.on('created', function(tribe) {
        tribes.number++;
        tribes.size += tribe.mass;
    }).on('massUpdated', function(delta) {
        tribes.size += delta;
    }).on('killed', function(tribe) {
        tribes.number--;
        tribes.size -= tribe.mass;
    }).on('deleted', function(tribe) {
        tribes.number--;
        tribes.size -= tribe.mass;
    });
    require('concert').on("reset", function() {
        tribes.number = 0;
        tribes.size = 0;

        tribesChart.data.datasets.forEach(dataset => {
            dataset.data.splice(0, dataset.data.length);
        });
    });
    setInterval(function() {
        var tVal = Date.now() - baseTime - timeCompensation;

        if (tribes.number !== tribesSnapshot.number) {
            if (tribesChart.data.datasets[0].data.length) {
                writeDataPoint(tribesChart, 0, tVal, tribes.number);
            } else {
                writeDataPoint(tribesChart, 0, 0, tribes.number);
            }
            tribesSnapshot.number = tribes.number;
            tribesChartUpdated = true;
        }
        if (tribes.size !== tribesSnapshot.size) {
            if (tribesChart.data.datasets[1].data.length) {
                writeDataPoint(tribesChart, 1, tVal, tribes.size);
            } else {
                writeDataPoint(tribesChart, 1, 0, tribes.number);
            }
            tribesSnapshot.size = tribes.size;
            tribesChartUpdated = true;
        }
    }, 500);


    // TRIBE LIST

    var tribeList = new List('table_tribes', {
        valueNames: ['id', 'empty', {name: 'color', attr: 'data-color'}, 'friends', 'enemies', 'time', {name: 'timestamp', attr: 'data-timestamp'}, {data: ['dead']}, {data: ['uncompensate']}],
        page: 10,
    });
    tribeList.clear();
    var sortList = function() {
        var sortedItemsList = Array.mergeSort.call(tribeList.items, function(left, right) {
            let lval = left.values().time;
            let rval = right.values().time;

            if (lval < rval) {
                return 1;
            } else if (lval === rval) {
                return 0;
            } else {
                return -1;
            }
        });
        for (let i in tribeList.items) {
            tribeList.items[i] = sortedItemsList[i];
        }
        tribeList.update();
        tribeList.visibleItems.forEach(function(tribeItem) {
            $(tribeItem.elm).find('.color').css('background-color', tribeItem.values().color);
        });
    };
    window.tribeList = tribeList;

    Tribe.prototype.on('created', function(tribe) {
        tribeList.add({
            id: tribe.ID,
            empty: ' ',
            color: tribe.color,
            uncompensate: timeCompensation,
            friends: 0,
            enemies: 0,
            time: 0,
            timestamp: Date.now(),
            dead: 0,
        });
        tribeList.update();

        var tribeItem = tribeList.get('id', tribe.ID)[0];
        if (tribeItem) {
            $(tribeItem.elm).find('.color').css('background-color', tribe.color);
        }
    }).on('madeFriend', function(tribe) {
        var tribeItem = tribeList.get('id', tribe.ID)[0];
        if (!tribeItem) {
            return;
        }

        var newFriends = Math.max(tribeItem.values().friends, tribe.friends.length);
        tribeItem.values({
            friends: newFriends
        });
    }).on('madeEnemy', function(tribe) {
        var tribeItem = tribeList.get('id', tribe.ID)[0];
        if (!tribeItem) {
            return;
        }

        var newEnemies = Math.max(tribeItem.values().enemies, tribe.enemies.length);
        tribeItem.values({
            enemies: newEnemies
        });
    }).on('killed', function(tribe) {
        var tribeItem = tribeList.get('id', tribe.ID)[0];
        if (!tribeItem) {
            return;
        }

        var values = tribeItem.values();
        var deltaTime = Math.ceil((Date.now() - values.timestamp - timeCompensation + values.uncompensate) / 100) / 10;

        tribeItem.values({
            time: deltaTime,
            dead: '1'
        });
        sortList();
    }).on('deleted', function(tribe) {
        tribeList.remove('id', tribe.ID);
        sortList();
    });

    $('#reset_table').on('click', function() {
        tribeList.clear();
    });
    $('#expand_table').on('click', function() {
        tribeList.show(0, 10000);
        tribeList.visibleItems.forEach(function(tribeItem) {
            $(tribeItem.elm).find('.color').css('background-color', tribeItem.values().color);
        });
    });
    $('#collapse_table').on('click', function() {
        tribeList.show(0, 10);
    });

    window.logaa = false;
    setInterval(function() {
        if (!pauseTime) {
            var valuesUpdates = 0;

            tribeList.items.forEach(function(tribe) {
                var values = tribe.values();
                if (!values.dead) {
                    var deltaTime = Math.ceil((Date.now() - values.timestamp - timeCompensation + values.uncompensate) / 100) / 10;
                    tribe.values({
                        time: deltaTime
                    });
                    valuesUpdates++;
                }
            });

            if (valuesUpdates) {
                sortList();
            }
        }
    }, 100);

    var chartUpdater = function() {
        if (resourcesChartUpdated) {
            resourcesChart.update(0);
            resourcesChartUpdated = false;
        }

        if (tribesChartUpdated) {
            tribesChart.update(0);
            tribesChartUpdated = false;
        }
    };

    setInterval(function() {
        requestAnimationFrame(chartUpdater);
    }, 20);
})();
