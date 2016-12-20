(function() {
    'use strict';
    angular.module('create.invoice.controller', [
        'ui.router',
        'user.service'
    ])
        .controller('CreateInvoiceController', function ($rootScope, $scope, $state, $uibModalInstance, $mixpanel,
                                                         UserService, Notification, ShopService) {

          ///////////////////////////////////////////
          ///////////// INITIAL DATA ////////////////
          ///////////////////////////////////////////

          // Get current user info
          var user = $rootScope.userSession.currentUser;

          // Initial date picker data
          var today = moment();
          $scope.minDate =  new Date(); // today
          $scope.minDueDate =  new Date(); // today
          $scope.maxDate = today.add(1, 'years'); // 1 year later
          $scope.datePicker = {
            dueDateOpened: false,
            billingDateOpened: false
          };

          // Get list of service and shopId
          $scope.services = $scope.params.services;
          $scope.shop = $scope.params.shop;
          $scope.listCustomer = $scope.shop.listCustomer;
        
          if($scope.listCustomer.indexOf("other") < 0){
              $scope.listCustomer.push("other");
          }

          ////////////////////////////////////////////////
          /////////////////// METHOD ///////////////////
          ////////////////////////////////////////////////
          $scope.openBillingDatePicker = function() {
            $scope.datePicker.billingDateOpened = true;
          };

          $scope.openDueDatePicker = function() {
            if($scope.billingDate){
                $scope.minDueDate = $scope.billingDate;
                $scope.datePicker.dueDateOpened = true;
            }else{
              Notification.error({
                  message: 'Please selecte Billing Date first!',
                  positionY: 'top',
                  positionX: 'center'
              });
            }

          };

          $scope.close = function(){
              $uibModalInstance.dismiss('cancel');
          };

          $scope.createInvoice = function(){
              var customer='';
              if($scope.selectedCustomer == 'other'){
                  customer = $scope.inputCustomer;
              }else{
                  customer = $scope.selectedCustomer;
              }

              if(!$scope.selectedService){
                  Notification.error({
                      message: 'Please select a service',
                      positionY: 'top',
                      positionX: 'center'
                  });
                  return;
              }
              ShopService.addInvoice(
                  $scope.shop.id,     // shopId
                  $scope.amount,            // amount
                  $scope.selectedService.currency, // currency
                  customer, // customer name
                  $scope.selectedService.name, // service name
                  null, // description
                  $scope.dueDate, // due date
                  $scope.billingDate, // billing date
                  function (response) {

                      if (response.status == 'OK') {
                          Notification.success({
                              message: response.message,
                              positionY: 'top',
                              positionX: 'center'
                          });

                          $uibModalInstance.close();
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
