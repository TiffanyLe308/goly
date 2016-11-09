(function() {
    'use strict';

    angular.module('footer', [])
        .directive('footer', function ($rootScope, CONFIG, $uibModal) {
            return {
                restrict: 'A',
                templateUrl: 'modules/footer/footer.html',
                scope: {

                },
                link: function (scope, element) {
                    scope.country = $rootScope.country;
                    scope.countryName = CONFIG.supportCountries[$rootScope.country].name;

                    scope.selectCountry = function () {
                        var modalInstance = $uibModal.open({
                            scope: scope,
                            animation: true,
                            templateUrl: 'modules/modal-template/select-country/select-country.html',
                            controller: 'SelectCountryController',
                            size: 'lg'
                        });
                    };
                }
            };
        });

})();
