import { CronService } from "./services/cronService.js";
import { CardsService } from "./services/cardsService.js";
import { CardsRepository } from "./repositories/cards-repository.js";
import { AltService } from "./services/altService.js";
import type { ICronService } from "./abstractions/icron-service.js";
import type { ICardsService } from "./abstractions/icards-service.js";
import { BeezieService } from "./services/beezieService.js";
import { drizzle } from "drizzle-orm/mysql2";
import "dotenv/config";

function initializeServices(): { cronService: ICronService; cardsService: ICardsService } {
  const database = drizzle(process.env.MYSQL_CONNECTION_URL!);
  const cardsService = new CardsService(new CardsRepository(database));
  const beezieService = new BeezieService();
  const altService = new AltService();
  return { cronService: new CronService(cardsService, beezieService, altService), cardsService };
}

export const services = initializeServices();
