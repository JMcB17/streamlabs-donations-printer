const state = {
    token: '',
    printers: [],
    selectedPrinter: '',
    minimumDonation: 0,
    running: false
}

const mutations = {
    set_token(state, token) {
        state.token = token
    },
    set_printers(state, printers) {
        state.printers = printers
    },
    set_selected_printer(state, printer) {
        state.selectedPrinter = printer
    },
    set_min_donation(state, amount) {
        state.minimumDonation = amount
    },
    start_running(state) {
        state.running = true
    },
    stop_running(state) {
        state.running = false
    }
}

const actions = {
    set_token({ commit }, token) {
        commit('set_token', token)
    },
    set_printers({ commit }, printers) {
        commit('set_printers', printers)
    },
    set_selected_printer({ commit }, printer) {
        commit('set_selected_printer', printer)
    },
    set_min_donation({ commit }, amount) {
        commit('set_min_donation', amount)
    },
    start_running({ commit }) {
        commit('start_running')
    },
    stop_running({ commit }) {
        commit('stop_running')
    }
}

export default {
    state,
    mutations,
    actions
}