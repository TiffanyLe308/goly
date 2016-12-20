(function () {
    'use strict';
    angular.module('select.country.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('SelectCountryController', function ($scope, $state, $uibModalInstance, $mixpanel, $rootScope,
                                                         UserService, CONFIG) {
            $scope.supportCountries = CONFIG.supportCountries;

            $scope.selectCountry = function (countryCode) {
                if ($rootScope.country != countryCode) {
                    UserService.setCurrentCountry(countryCode);
                    var params = {};
                    if ($state.current.name == 'search') {
                        params.country = undefined;
                        params.city = undefined;
                    } else if ($state.current.name.indexOf('explore') === 0) {
                        // If user is at Explore page, then go to the main explore page
                        $state.go('explore', {}, {
                            reload: true
                        });
                        return;
                    }

                    $state.go('.', params, {
                        reload: true
                    });
                }
                $uibModalInstance.close();
            };
        });
}());
