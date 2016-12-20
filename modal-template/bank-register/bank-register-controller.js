(function() {
    'use strict';
    angular.module('bank.register.controller', [
        'ui.router',
        'user.service'
    ])
    .controller('BankRegisterController', function($scope, $state, $uibModalInstance,
        UserService, Notification, ShopService) {

        $scope.modal_title = 'Register payout info';
        // Get current user info
        // If not exist, redirect to login page
        var token = UserService.getUserInfo();
        if(!token){
            Notification.error({
                message: 'Cannot identify user. Please login first!',
                positionY: 'top',
                positionX: 'center'
            });
            $state.go("login");
        }
        var shop = $scope.params.shop;
        if(!shop){
            Notification.error({
                message: 'Cannot identify shop. Please try again!',
                positionY: 'top',
                positionX: 'center'
            });
            $uibModalInstance.dismiss('cancel');
        }

        //initial data
        if(shop.payoutAccount){
            $scope.firstName = shop.payoutAccount.firstName;
            $scope.lastName = shop.payoutAccount.lastName;
            $scope.bankName = shop.payoutAccount.bankName;
            $scope.bankAccount = shop.payoutAccount.bankAccount;
            $scope.modal_title = 'Change payout info';
        }

        $scope.close = function(){
            $uibModalInstance.dismiss('cancel');
        };

        $scope.save = function() {
            ShopService.registerPayout(
                shop.id,
                $scope.bankAccount,
                $scope.bankName,
                $scope.firstName,
                $scope.lastName,
                'BANK',
                function (response) {

                    if (response.status == 'OK') {
                        Notification.success({
                            message: response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                        var bankAcc = {
                          'bankAccount': $scope.bankAccount,
                          'bankName': $scope.bankName
                        };
                        $uibModalInstance.close(bankAcc);
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
}());
