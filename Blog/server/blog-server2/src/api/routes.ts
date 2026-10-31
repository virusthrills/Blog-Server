import { Router } from "express";
import { GetArticlesController } from "../controller/articlecontrol";
import {
  getAllUsers,
  login,
  refreshToken,
  register,
  updateUserRole,
} from "../controller/register";
import { logout } from "../controller/logout";
import { authenticate } from "../middleware/verifytoken";
import { authorize } from "../middleware/roleauth";
// import uploadCloudinary from "../controller/uploadcontrol";
// import upload from "../middleware/upload";

const userRouter = Router();

userRouter.get("/user", getAllUsers);
// userRouter.post("/up", upload.single("image"), uploadCloudinary);
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/refresh-token", refreshToken);
userRouter.post("/logout", logout);
userRouter.patch(
  "/users/:id/role",
  authenticate,
  authorize("admin"),
  updateUserRole,
);
userRouter.get("/articles", GetArticlesController);
userRouter.get("/help", (_req, res) => {
  res.send(
    "This is the help page for the user routes. You can use the following endpoints: /articles, /help",
  );
});

export default userRouter;
