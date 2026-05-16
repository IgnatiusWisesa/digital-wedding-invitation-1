import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rsvpRouter from "./rsvp";
import adminRouter from "./admin";
import photosRouter from "./photos";
import checkinRouter from "./checkin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rsvpRouter);
router.use(adminRouter);
router.use(photosRouter);
router.use(checkinRouter);

export default router;
