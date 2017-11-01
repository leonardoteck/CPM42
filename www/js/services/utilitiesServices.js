(function() {
    'use strict';

    angular
        .module('starter.services')
        .service('utilities', utilities);

    utilities.$inject = ['$ionicPopup', '$ionicLoading'];
    function utilities($ionicPopup, $ionicLoading) {
        this.promiseRejection = promiseRejection;
        this.promiseException = promiseException;
        this.apiError = apiError;
        this.isApp = isApp;

        var _isApp = false;
        
        activate();

        ////////////////

        function activate() {
            // window.defineExceptionHandler(function () {
            //     promiseException('Exceção global capturada!');
            // });
            _isApp = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        }

        function promiseRejection(errorMessage) {
            $ionicLoading.hide();
            $ionicPopup.alert({
                title: 'Ops!',
                template: errorMessage
            });
        }

        function promiseException(errorMessage) {
            console.error('cpm42 - ' + errorMessage);
            $ionicLoading.hide();
            $ionicPopup.alert({
                title: 'Ops!',
                template: 'Ocorreu um erro no aplicativo: ' + errorMessage
            });
        }

        function apiError(data) {
            try {
                console.error(data);
                $ionicLoading.hide();
                $ionicPopup.alert({
                    title: 'Ops!',
                    template: data[0].errorMessage
                });
            } catch (error) {
                promiseException(error);
            }
        }

        function isApp() {
            return _isApp;
        }
    }
})();