class ParkingSystem {
    constructor() {
        this.plateRanges = {
            'AAA-BEZ': 'Paraná',
            'BFA-GKI': 'São Paulo',
            'GKJ-HOK': 'Minas Gerais',
            'HOL-HQE': 'Maranhão',
            'HQF-HTW': 'Mato Grosso do Sul',
            'HTX-HZA': 'Ceará',
            'HZB-IAP': 'Sergipe',
            'IAQ-JDO': 'Rio Grande do Sul',
            'JDP-JKR': 'Distrito Federal',
            'JKS-JSZ': 'Bahia',
            'JTA-JWE': 'Pará',
            'JWF-JXY': 'Amazonas',
            'JXZ-KAU': 'Mato Grosso',
            'KAV-KFC': 'Goiás',
            'KFD-KME': 'Pernambuco',
            'KMF-LVE': 'Rio de Janeiro',
            'LVF-LWQ': 'Piauí',
            'LWR-MMM': 'Santa Catarina',
            'MMN-MOW': 'Paraíba',
            'MOX-MTZ': 'Espírito Santo',
            'MUA-MVK': 'Alagoas',
            'MVL-MXG': 'Tocantins',
            'MXH-MZM': 'Rio Grande do Norte',
            'MZN-NAG': 'Acre',
            'NAH-NBA': 'Roraima',
            'NBB-NEH': 'Rondônia',
            'NEI-NFB': 'Amapá'
        };
        
        this.vehicles = new Map();
        this.parkingGrid = [];
        this.gridRows = 5;
        this.gridCols = 5;
        this.priceFirstThreeHours = 5.00;
        this.priceAdditionalHour = 3.00;
        
        this.initializeParkingGrid();
        this.updateParkingDisplay();
        this.setCurrentTime();
    }

    initializeParkingGrid() {
        this.parkingGrid = [];
        for (let i = 0; i < this.gridRows; i++) {
            this.parkingGrid[i] = [];
            for (let j = 0; j < this.gridCols; j++) {
                this.parkingGrid[i][j] = null;
            }
        }
    }

    setCurrentTime() {
        const now = new Date();
        const dateTimeString = now.toISOString().slice(0, 16);
        document.getElementById('entryTime').value = dateTimeString;
        document.getElementById('exitTime').value = dateTimeString;
    }

    validatePlateFormat(plate) {
        const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
        return mercosulPattern.test(plate.toUpperCase());
    }

    getStateFromPlate(plate) {
        const platePrefix = plate.substring(0, 3).toUpperCase();
        for (const [range, state] of Object.entries(this.plateRanges)) {
            const [start, end] = range.split('-');
            if (platePrefix >= start && platePrefix <= end) {
                return state;
            }
        }
        return null;
    }

    findFreeSpot() {
        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridCols; j++) {
                if (this.parkingGrid[i][j] === null) {
                    return { row: i, col: j, spot: `${String.fromCharCode(65 + i)}${j + 1}` };
                }
            }
        }
        return null;
    }

    calculateParkingCost(entryTime, exitTime) {
        const entry = new Date(entryTime);
        const exit = new Date(exitTime);
        const diffMs = exit - entry;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes <= 15) {
            return { hours: 0, minutes: diffMinutes, cost: 0 };
        }

        const totalHours = Math.ceil(diffMinutes / 60);
        let cost = 0;

        if (totalHours <= 3) {
            cost = this.priceFirstThreeHours;
        } else {
            cost = this.priceFirstThreeHours + ((totalHours - 3) * this.priceAdditionalHour);
        }

        return {
            hours: Math.floor(diffMinutes / 60),
            minutes: diffMinutes % 60,
            totalMinutes: diffMinutes,
            cost: cost
        };
    }

    registerEntry() {
        const plate = document.getElementById('plateEntry').value.toUpperCase().trim();
        const entryTime = document.getElementById('entryTime').value;

        if (!plate || !entryTime) {
            this.showStatus('entryStatus', 'Por favor, preencha todos os campos.', 'danger');
            return;
        }

        if (!this.validatePlateFormat(plate)) {
            this.showStatus('entryStatus', 'Formato de placa inválido. Use o padrão Mercosul (ABC1D23).', 'danger');
            return;
        }

        if (this.vehicles.has(plate)) {
            this.showStatus('entryStatus', 'Veículo já está no estacionamento.', 'danger');
            return;
        }

        const state = this.getStateFromPlate(plate);
        if (!state) {
            this.showStatus('entryStatus', 'Placa não corresponde a nenhum estado brasileiro válido.', 'danger');
            return;
        }

        const freeSpot = this.findFreeSpot();
        if (!freeSpot) {
            this.showStatus('entryStatus', 'Estacionamento lotado. Não há vagas disponíveis.', 'danger');
            return;
        }

        this.vehicles.set(plate, {
            plate: plate,
            state: state,
            entryTime: entryTime,
            spot: freeSpot,
            exitTime: null
        });

        this.parkingGrid[freeSpot.row][freeSpot.col] = plate;

        this.showStatus('entryStatus', 
            `Entrada registrada com sucesso!<br>
            <strong>Placa:</strong> ${plate}<br>
            <strong>Estado:</strong> ${state}<br>
            <strong>Vaga:</strong> ${freeSpot.spot}<br>
            <strong>Horário:</strong> ${new Date(entryTime).toLocaleString('pt-BR')}`, 
            'success'
        );

        this.updateParkingDisplay();
        this.clearForm('entry');
    }

    registerExit() {
        const plate = document.getElementById('plateExit').value.toUpperCase().trim();
        const exitTime = document.getElementById('exitTime').value;

        if (!plate || !exitTime) {
            this.showStatus('exitStatus', 'Por favor, preencha todos os campos.', 'danger');
            return;
        }

        if (!this.vehicles.has(plate)) {
            this.showStatus('exitStatus', 'Veículo não encontrado no estacionamento.', 'danger');
            return;
        }

        const vehicle = this.vehicles.get(plate);
        vehicle.exitTime = exitTime;

        const costInfo = this.calculateParkingCost(vehicle.entryTime, exitTime);

        this.parkingGrid[vehicle.spot.row][vehicle.spot.col] = null;

        this.showTicket(vehicle, costInfo);
        this.showStatus('exitStatus', 
            `Saída registrada com sucesso!<br>
            <strong>Placa:</strong> ${plate}<br>
            <strong>Tempo:</strong> ${costInfo.hours}h ${costInfo.minutes}min<br>
            <strong>Valor:</strong> R$ ${costInfo.cost.toFixed(2)}`, 
            'success'
        );

        this.vehicles.delete(plate);
        this.updateParkingDisplay();
        this.clearForm('exit');
    }

    calculateCost() {
        const plate = document.getElementById('plateExit').value.toUpperCase().trim();
        const exitTime = document.getElementById('exitTime').value;

        if (!plate || !exitTime) {
            this.showStatus('exitStatus', 'Por favor, preencha todos os campos.', 'danger');
            return;
        }

        if (!this.vehicles.has(plate)) {
            this.showStatus('exitStatus', 'Veículo não encontrado no estacionamento.', 'danger');
            return;
        }

        const vehicle = this.vehicles.get(plate);
        const costInfo = this.calculateParkingCost(vehicle.entryTime, exitTime);

        this.showStatus('exitStatus', 
            `<strong>Cálculo do Valor:</strong><br>
            Tempo de permanência: ${costInfo.hours}h ${costInfo.minutes}min<br>
            Valor a pagar: <strong>R$ ${costInfo.cost.toFixed(2)}</strong><br>
            <small>Tolerância: 15 minutos gratuitos<br>
            Até 3h: R$ ${this.priceFirstThreeHours.toFixed(2)} | Hora adicional: R$ ${this.priceAdditionalHour.toFixed(2)}</small>`, 
            'info'
        );
    }

    validatePlate() {
        const plate = document.getElementById('plateEntry').value.toUpperCase().trim();

        if (!plate) {
            this.showStatus('entryStatus', 'Por favor, digite uma placa.', 'danger');
            return;
        }

        if (!this.validatePlateFormat(plate)) {
            this.showStatus('entryStatus', 'Formato inválido. A placa deve seguir o padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23)', 'danger');
            return;
        }

        const state = this.getStateFromPlate(plate);
        if (state) {
            this.showStatus('entryStatus', 
                `<strong>Placa válida!</strong><br>
                Formato: Mercosul ✓<br>
                Estado: ${state}`, 
                'success'
            );
        } else {
            this.showStatus('entryStatus', 'Placa não corresponde a nenhum estado brasileiro válido.', 'danger');
        }
    }

    showTicket(vehicle, costInfo) {
        document.getElementById('ticketPlate').textContent = vehicle.plate;
        document.getElementById('ticketState').textContent = vehicle.state;
        document.getElementById('ticketSpot').textContent = vehicle.spot.spot;
        document.getElementById('ticketEntryTime').textContent = new Date(vehicle.entryTime).toLocaleString('pt-BR');
        document.getElementById('ticketExitTime').textContent = new Date(vehicle.exitTime).toLocaleString('pt-BR');
        document.getElementById('ticketDuration').textContent = `${costInfo.hours}h ${costInfo.minutes}min`;
        document.getElementById('ticketTotal').textContent = `R$ ${costInfo.cost.toFixed(2)}`;
        
        document.getElementById('ticketDisplay').style.display = 'block';
    }

    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    updateParkingDisplay() {
        const grid = document.getElementById('parkingGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridCols; j++) {
                const spot = document.createElement('div');
                const spotId = `${String.fromCharCode(65 + i)}${j + 1}`;
                
                if (this.parkingGrid[i][j] === null) {
                    spot.className = 'parking-spot free';
                    spot.textContent = spotId;
                    spot.title = 'Vaga livre';
                } else {
                    spot.className = 'parking-spot occupied';
                    spot.textContent = this.parkingGrid[i][j];
                    spot.title = `Ocupada por: ${this.parkingGrid[i][j]}`;
                }
                
                grid.appendChild(spot);
            }
        }
        
        this.updateStats();
    }

    updateStats() {
        const total = this.gridRows * this.gridCols;
        const occupied = this.vehicles.size;
        const free = total - occupied;
        
        document.getElementById('totalSpots').textContent = total;
        document.getElementById('occupiedSpots').textContent = occupied;
        document.getElementById('freeSpots').textContent = free;
    }

    updateParkingGrid() {
        const gridSize = document.getElementById('gridSize').value;
        const [rows, cols] = gridSize.split('x').map(Number);
        
        this.gridRows = rows;
        this.gridCols = cols;
        
        const oldVehicles = new Map(this.vehicles);
        this.vehicles.clear();
        this.initializeParkingGrid();
        
        let spotIndex = 0;
        for (const [plate, vehicle] of oldVehicles) {
            if (spotIndex < this.gridRows * this.gridCols) {
                const row = Math.floor(spotIndex / this.gridCols);
                const col = spotIndex % this.gridCols;
                
                vehicle.spot = { 
                    row: row, 
                    col: col, 
                    spot: `${String.fromCharCode(65 + row)}${col + 1}` 
                };
                
                this.parkingGrid[row][col] = plate;
                this.vehicles.set(plate, vehicle);
                spotIndex++;
            }
        }
        
        this.updateParkingDisplay();
    }

    clearForm(type) {
        if (type === 'entry') {
            document.getElementById('plateEntry').value = '';
            this.setCurrentTime();
        } else if (type === 'exit') {
            document.getElementById('plateExit').value = '';
            this.setCurrentTime();
        }
    }
}

const parkingSystem = new ParkingSystem();

function registerEntry() {
    parkingSystem.registerEntry();
}

function registerExit() {
    parkingSystem.registerExit();
}

function calculateCost() {
    parkingSystem.calculateCost();
}

function validatePlate() {
    parkingSystem.validatePlate();
}

function updateParkingGrid() {
    parkingSystem.updateParkingGrid();
}

document.getElementById('plateEntry').addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

document.getElementById('plateExit').addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});