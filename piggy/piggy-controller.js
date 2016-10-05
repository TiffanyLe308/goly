(function() {
    'use strict';
    angular.module('piggy.controller', [
            'ui.router',
            'user.service'
        ])

        .config(['$stateProvider', function($stateProvider) {
            $stateProvider
                .state('piggy', {
                    url: '/piggy',
                    templateUrl: 'modules/piggy/piggy.html',
                    controller: 'piggyController',
                    onEnter : function (UserService, $state, $rootScope) {
                        if (!$rootScope.userSession || !$rootScope.userSession.currentUser.active) {
                           $state.go('login');
                        }else if(!$rootScope.userSession.currentUser.serviceProvider){
                            $state.go('explore');
                        }
                    }
                });
        }])
        .controller('piggyController', function ($rootScope, $scope, $state, $uibModal, Notification,
                                                 UserService, ShopService, ServiceService) {
            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////
            var user = $rootScope.userSession.currentUser;
            Chart.defaults.global.colours = [];
            $scope.labels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            $scope.series = ['Sales'];
            $scope.data = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            $scope.services = [];
            $scope.sales = [];

            $scope.datePicker = [];
            $scope.datePicker.date = {
                startDate: moment().subtract(29, 'days'),
                endDate: moment()
            };

            $scope.datePicker.opts = {
                locale: {
                    applyClass: 'btn-green',
                    autoApply: "true",
                    applyLabel: "Použít",
                    fromLabel: "Od",
                    toLabel: "Do",
                    cancelLabel: 'Zrušit',
                    customRangeLabel: 'Vlastní rozsah',
                    daysOfWeek: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
                    firstDay: 1,
                    monthNames: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září',
                        'Říjen', 'Listopad', 'Prosinec'
                    ]
                },
                ranges: {
                    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()]
                }
            };

            // Get my shop
            ShopService.listShopsByUser(user.id, function (response) {
                if (response.status == 'OK') {
                    if(response.shops){
                        $scope.shop = response.shops[0];

                        if($scope.shop){
                            $scope.groups = $scope.shop.listGroups;

                            // List out all services of shop
                            ServiceService.getServicesByProvider($scope.shop.id, function (response) {
                                if (response.status == 'OK') {
                                    $scope.myServices = response.services;
                                } else {
                                    Notification.error({
                                        message: response.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
                                }
                            });

                            // List out invoices of shop by default date
                            ShopService.listInvoices(
                                $scope.shop.id,
                                $scope.datePicker.date.startDate,
                                $scope.datePicker.date.endDate,
                                function(response){
                                    if (response.status == 'OK') {
                                        $scope.invoices = response.invoices;
                                        setPieChartData(response.invoices);
                                    } else {
                                        Notification.error({
                                            message: response.message,
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                    }
                                }
                            );
                        }
                    }
                } else {
                    Notification.error({
                        message: response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });

            ////////////////////////////////////////////////
            /////////////////// METHOD ///////////////////
            ////////////////////////////////////////////////
            $scope.onClick = function(points, evt) {

            };

            $scope.onDatePickerApply = function() {
                ShopService.listInvoices(
                    $scope.shop.id,
                    $scope.datePicker.date.startDate,
                    $scope.datePicker.date.endDate,
                    function(response){
                        if (response.status == 'OK') {
                            $scope.invoices = response.invoices;
                            setPieChartData(response.invoices);
                        } else {
                            Notification.error({
                                message: response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };

            $scope.openAddInvoiceModal = function () {
                var scope = $rootScope.$new();
                scope.params = {
                    services : $scope.myServices,
                    shop : $scope.shop
                };
                var modalInstance = $uibModal.open({
                    scope : scope,
                    animation : true,
                    templateUrl : 'modules/modal-template/create-invoice/create-invoice.html',
                    controller : 'CreateInvoiceController',
                    size: 'lg'
                });

                modalInstance.result.then(function () {
                    $state.go($state.current, {}, {reload: true});
                }, function () {

                });
            };

            $scope.openInvoicePage = function(invoice){
                $state.go('invoice', { 'invoice':invoice, 'shop':$scope.shop });
            };

            var setPieChartData = function (invoices){
                for (var i=0; i<invoices.length; i++){
                    // Statistic for Pie Chart
                    if($scope.services.indexOf(invoices[i].service) < 0){
                        $scope.services.push(invoices[i].service);
                        $scope.sales.push(invoices[i].amount);
                    }else{
                        var index = $scope.services.indexOf(invoices[i].service);
                        $scope.sales[index] = $scope.sales[index] + invoices[i].amount;
                    }

                    // Statistic for Line Chart
                    var monthOfInvoice = new Date(invoices[i].billingDate).getMonth();
                    $scope.data[0][monthOfInvoice] = $scope.data[0][monthOfInvoice] + invoices[i].amount;
                }
            };

        });
}());
