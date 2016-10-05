(function() {
    'use strict';
    angular.module('invoice.controller', [
            'ui.router'
        ])
        .config(['$stateProvider', function($stateProvider) {
            $stateProvider
                .state('invoice', {
                    url: '/invoice',
                    templateUrl: 'modules/invoice/invoice.html',
                    controller: 'invoiceController',
                    params : {
                        'invoice' : undefined,
                        'shop' : undefined
                    },
                    onEnter : function (UserService, $state, $rootScope) {
                        if (!$rootScope.userSession || !$rootScope.userSession.currentUser.active) {
                            $state.go('login');
                        } else if(!$rootScope.userSession.currentUser.serviceProvider){
                            $state.go('explore');
                        }
                    }
                });
        }])
        .controller('invoiceController', function($rootScope, $scope, $state, $stateParams, $uibModal,
            Notification, ShopService, CONFIG, $http) {
            /////////////////////////////////////////////
            /////////////// INITIAL DATA ////////////////
            /////////////////////////////////////////////

            $scope.invoice = $stateParams.invoice;
            $scope.shop = $stateParams.shop;
            // if(!$scope.invoice || !$scope.shop){
            //     $state.go('piggy');
            // }

            /////////////////////////////////////////////
            /////////////// METHOD ////////////////
            /////////////////////////////////////////////

            $scope.openAddPaymentModal = function () {
                var scope = $rootScope.$new();
                scope.params = {
                    invoice : $scope.invoice,
                    shop : $scope.shop
                };
                var modalInstance = $uibModal.open({
                    scope : scope,
                    animation : true,
                    templateUrl : 'modules/modal-template/create-payment/create-payment.html',
                    controller : 'CreatePaymentController',
                    size: 'lg'
                });

                modalInstance.result.then(function (invoice) {
                    $scope.invoice = invoice;
                }, function () {
                });
            };

            $scope.removePayment = function (payment) {
                ShopService.deletePayment(
                    $scope.shop.id,     // shopId
                    $scope.invoice.invoiceNo, // invoiceNo
                    payment.amount, // amount
                    payment.paymentDate, // paymentDate
                    function (response) {

                        if (response.status == 'OK') {
                            $scope.invoice = response.invoice;

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

            $scope.sendInvitation = function () {
                var scope = $rootScope.$new();
                var modalInstance = $uibModal.open({
                    scope: scope,
                    animation: true,
                    templateUrl: 'modules/modal-template/send-invitation/send-invitation.html',
                    controller: 'SendInvitationController',
                    size: 'lg'
                });

                modalInstance.result.then(function () {

                }, function () {

                });
            };

            $scope.backtoShop = function () {
                $state.go('shop',{ 'navigateView':'dashboard' });
            };

            $scope.deleteInvoice = function () {
                ShopService.deleteInvoice(
                    $scope.shop.id,     // shopId
                    $scope.invoice.invoiceNo, // invoiceNo
                    function (response) {
                        if (response.status == 'OK') {
                            $scope.invoice = response.invoice;
                            $state.go('shop',{ 'navigateView':'dashboard'});

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
      });
})();
