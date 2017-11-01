(function () {
    'use strict';

    angular
        .module('starter.controllers')
        .controller('homeController', homeController);

    homeController.$inject = ['$state', '$ionicPopup', '$scope', '$ionicLoading', '$ionicHistory', '$timeout'];

    function homeController($state, $ionicPopup, $scope, $ionicLoading, $ionicHistory, $timeout) {
        var vm = this;

        vm.dados = [];
        vm.tarefa = {};

        vm.add = add;
        vm.alterar = alterar;
        vm.filtrarPrecedentes = filtrarPrecedentes;
        vm.mostrarDiagrama = mostrarDiagrama;
        vm.colunas = [];
        vm.relacoes = [];

        var id = 0;

        activate();

        function activate() {
            vm.dados.push({
                nome: 'Início',
                id: 0,
                precedentes: [],
                dias: 0
            });
            vm.dados.push({
                nome: 'Fim',
                id: 1,
                precedentes: [vm.dados[0]],
                dias: 0
            });
            resetaTarefa();
        }

        //////////////// Public

        function add() {
            $ionicPopup.show({
                title: 'Adicionar tarefa',
                templateUrl: 'templates/tarefa.html',
                scope: $scope,
                buttons: [{
                    text: 'Cancelar',
                    type: 'button-default',
                    onTap: function () {
                        resetaTarefa();
                        return false;
                    }
                }, {
                    text: 'OK',
                    type: 'button-royal',
                    onTap: function (e) {
                        return true;
                    }
                }]
            }).then(function (salvar) {
                if (!salvar)
                    return;
                vm.tarefa.id = ++id;
                var precs = [];
                vm.tarefa.precedentes.forEach(function (prec, index) {
                    if (prec)
                        precs.push(vm.dados[index]);
                });
                vm.tarefa.precedentes = precs;
                vm.dados.pop();
                vm.dados.push(vm.tarefa);
                resolveFim(++id);
                resetaTarefa();
            });
        }

        function alterar(index) {
            if (index == 0 || index == vm.dados.length - 1)
                return;
            vm.tarefa = JSON.parse(JSON.stringify(vm.dados[index]));

            vm.tarefa.precedentes = [];
            vm.dados.forEach(function (tar, i) {
                vm.tarefa.precedentes[i] = false;
                if (vm.dados[index].precedentes.find(function (tt) {
                        return tt.id === tar.id;
                    }))
                    vm.tarefa.precedentes[i] = true;
            });

            $ionicPopup.show({
                title: 'Alterar tarefa',
                templateUrl: 'templates/tarefa.html',
                scope: $scope,
                buttons: [{
                    text: 'Excluir',
                    type: 'button-assertive',
                    onTap: function () {
                        excluir(index);
                        resetaTarefa();
                        var fim = vm.dados.pop();
                        resolveFim(fim.id);
                        return false;
                    }
                }, {
                    text: 'Cancelar',
                    type: 'button-default',
                    onTap: function () {
                        resetaTarefa();
                        return false;
                    }
                }, {
                    text: 'OK',
                    type: 'button-royal',
                    onTap: function (e) {
                        return true;
                    }
                }]
            }).then(function (salvar) {
                if (!salvar)
                    return;
                var precs = [];
                vm.tarefa.precedentes.forEach(function (prec, index) {
                    if (prec)
                        precs.push(vm.dados[index]);
                });
                vm.tarefa.precedentes = precs;
                vm.dados[index] = vm.tarefa;
                var fim = vm.dados.pop();
                resolveFim(fim.id);
                resetaTarefa();
            });
        }

        function filtrarPrecedentes(tarefa) {
            if (tarefa.id === vm.tarefa.id || tarefa.id === vm.dados[vm.dados.length - 1].id)
                return false;

            var naoPrecede = true;
            (function findPrec(tar) {
                for (var i = 0; i < tar.precedentes.length; i++)
                    if (tar.precedentes[i].id === vm.tarefa.id) {
                        naoPrecede = false;
                        return true;
                    }
                for (i = 0; i < tar.precedentes.length; i++)
                    if (findPrec(tar.precedentes[i]))
                        return true;

            })(tarefa);

            return naoPrecede;
        }

        function mostrarDiagrama() {
            vm.diagramaOn = !vm.diagramaOn;
            if (vm.colunas.length == 0) {
                vm.colunas.push([vm.dados[0]]);

                for (var i = 0; i < vm.colunas.length; i++) {
                    var coluna = vm.colunas[i];
                    if (coluna.length > 0)
                        vm.colunas.push([]);
                    for (var j = 0; j < coluna.length; j++) {
                        var itemColuna = coluna[j];
                        itemColuna.subsequentes = [];

                        for (var k = 0; k < vm.dados.length; k++) {
                            var tarefa = vm.dados[k];
                            for (var l = 0; l < tarefa.precedentes.length; l++) {
                                var precedente = tarefa.precedentes[l];
                                if (precedente.id === itemColuna.id) {
                                    if (vm.colunas[i + 1].findIndex(function (gg) {
                                        return gg.id == tarefa.id;
                                    }) == -1)
                                        vm.colunas[i + 1].push(tarefa);
                                    itemColuna.temSubsequente = true;

                                    // se apareceu outra vez em uma colua anterior, remove
                                    for (var m = 0; m < i + 1; m++) {
                                        var colunaAnt = vm.colunas[m];
                                        for (var n = 0; n < colunaAnt.length; n++) {
                                            var itemColunaAnt = colunaAnt[n];
                                            if (itemColunaAnt.id == tarefa.id)
                                                colunaAnt.splice(n--, 1);
                                        }
                                    }

                                    vm.relacoes.push({
                                        origem: itemColuna,
                                        destino: tarefa,
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: 0
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }

                vm.colunas.pop();
                vm.colunas[vm.colunas.length - 1] = [vm.colunas[vm.colunas.length - 1][0]]
                vm.dados[0].ES = 0;
                vm.dados[0].EF = 0;
                vm.dados[0].LS = 0;
                vm.dados[0].LF = 0;
                vm.dados[0].folga = 0;
                var col, item;
                for (var o = 1; o < vm.colunas.length - 1; o++) {
                    col = vm.colunas[o];
                    for (var p = 0; p < col.length; p++) {
                        item = col[p];

                        var EF = item.precedentes[0].EF;
                        if (item.precedentes.length > 0)
                            item.precedentes.forEach(function (prec) {
                                if (prec.EF > EF)
                                    EF = prec.EF;
                            });

                        item.ES = EF + 1;
                        item.EF = item.ES + item.dias - 1;
                    }
                }

                var ultimo = vm.dados[vm.dados.length - 1];
                ultimo.EF = 0;
                ultimo.precedentes.forEach(function (prec) {
                    if (prec.EF > ultimo.EF)
                    ultimo.EF = prec.EF;
                });
                ultimo.LF = ultimo.EF;
                ultimo.ES = ultimo.EF;
                ultimo.LS = ultimo.EF;
                ultimo.folga = 0;
                
                for (var q = vm.colunas.length - 1; q > 0; q--) {
                    col = vm.colunas[q];
                    for (var r = 0; r < col.length; r++) {
                        item = col[r];
                        item.LS = item.LF - item.dias + 1;
                        item.folga = item.LS - item.ES;
                        for (var s = 0; s < item.precedentes.length; s++) {
                            var prec = item.precedentes[s];
                            prec.LF = item.LS - 1;
                        }
                    }
                }
                vm.dados[vm.dados.length - 1].folga = 0;
            }

            $timeout(function () {
                vm.relacoes.forEach(function (relacao) {
                    var elOrigem = document.getElementById('tb' + relacao.origem.id);
                    var elDestino = document.getElementById('tb' + relacao.destino.id);

                    relacao.x1 = elOrigem.offsetLeft + (elOrigem.offsetWidth / 2);
                    relacao.y1 = elOrigem.offsetTop + (elOrigem.offsetHeight / 2);

                    relacao.x2 = elDestino.offsetLeft + (elDestino.offsetWidth / 2);
                    relacao.y2 = elDestino.offsetTop + (elDestino.offsetHeight / 2);
                }, this);
            }, 300);
        }

        //////////////// Private

        function resetaTarefa() {
            vm.tarefa = {};
            vm.tarefa.nome = 'Tarefa ' + (vm.dados.length - 1);
            vm.tarefa.dias = 1;
            vm.tarefa.precedentes = [];
            vm.colunas = [];
            vm.relacoes = [];
        }

        function resolveFim(id) {
            var fim = {
                nome: 'Fim',
                id: id,
                precedentes: [],
                dias: 0
            };
            for (var i = 0; i < vm.dados.length; i++) {
                var tarefa = vm.dados[i];
                var naoPrecede = true;
                for (var j = 0; j < vm.dados.length; j++) {
                    var tarefa2 = vm.dados[j];
                    for (var k = 0; k < tarefa2.precedentes.length; k++) {
                        var precedente = tarefa2.precedentes[k];
                        if (precedente.id === tarefa.id) {
                            naoPrecede = false;
                            break;
                        }
                    }
                }
                if (naoPrecede)
                    fim.precedentes.push(tarefa);
            }
            vm.dados.push(fim);
        }

        function excluir(index) {
            vm.dados.forEach(function (tar) {
                var i = tar.precedentes.findIndex(function (tt) {
                    return tt.id === vm.dados[index].id;
                });
                if (i >= 0)
                    tar.precedentes.splice(i, 1);

            }, this);
            vm.dados.splice(index, 1);
        }
    }
})();
