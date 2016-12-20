(function() {
    'use strict';
    angular.module('create.payment.controller', [
        'ui.router',
        'user.service'
    ])
        .controller('CreatePaymentController', function ($rootScope, $scope, $state, $uibModalInstance, $mixpanel,
                                                         UserService, Notification, ShopService) {

          ///////////////////////////////////////////
          ///////////// INITIAL DATA ////////////////
          ///////////////////////////////////////////

          // Get current user info
          var user = $rootScope.userSession.currentUser;
          // Get invoice and shop
          $scope.invoice = $scope.params.invoice;
          $scope.shop = $scope.params.shop;
          if(!$scope.invoice || !$scope.shop){
              $uibModalInstance.dismiss('cancel');
          }

          var today = moment();
          $scope.minDate =  $scope.invoice.billingDate; // billingDate
          $scope.maxDate = today.add(1, 'years'); // 1 year later
          $scope.datePicker = {
            opened: false
          };


          ////////////////////////////////////////////////
          /////////////////// METHOD ///////////////////
          ////////////////////////////////////////////////
          $scope.close = function(){
              $uibModalInstance.dismiss('cancel');
          };

          $scope.openDatePicker = function() {
            $scope.datePicker.opened = true;
          };

          $scope.addPayment = function(){
              ShopService.addPayment(
                  $scope.shop.id,     // shopId
                  $scope.invoice.invoiceNo, // invoiceNo
                  $scope.amount, // amount
                  $scope.paymentDate, // paymentDate
                  function (response) {

                      if (response.status == 'OK') {
                          Notification.success({
                              message: response.message,
                              positionY: 'top',
                              positionX: 'center'
                          });

                          $uibModalInstance.close(response.invoice);
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
