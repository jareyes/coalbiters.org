

class Ticket {
  constructor() {}

  get url() {
    return `${TICKET_URL}/${this.confirmation}`;
  }
}

Ticket.write_pdf = write_pdf;
module.exports = Ticket;
