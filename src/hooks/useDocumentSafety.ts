import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { isPlausibleScene } from "../scene/validate";
import { useDocumentStore } from "../store/documentStore";
import { useSceneStore } from "../store/sceneStore";

const AUTOSAVE_DELAY_MS = 30_000;

export function useDocumentSafety() {
  useEffect(() => {
    let initialized = false;
    let timer: number | null = null;

    void invoke<unknown | null>("load_recovery")
      .then((scene) => {
        if (scene && isPlausibleScene(scene)) {
          useDocumentStore.getState().setRecoveryAvailable(true);
          if (window.confirm("Une sauvegarde de récupération a été trouvée. Voulez-vous la restaurer ?")) {
            useSceneStore.getState().replaceScene(scene);
            useDocumentStore.getState().markDirty();
          } else {
            void invoke("clear_recovery");
            useDocumentStore.getState().setRecoveryAvailable(false);
          }
        }
      })
      .finally(() => {
        initialized = true;
      });

    const unsubscribe = useSceneStore.subscribe((state, previous) => {
      if (!initialized || state.scene === previous.scene) return;
      useDocumentStore.getState().markDirty();
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!useDocumentStore.getState().dirty) return;
        void invoke("save_recovery", { scene: useSceneStore.getState().scene }).then(() => {
          useDocumentStore.getState().setRecoveryAvailable(true);
        });
      }, AUTOSAVE_DELAY_MS);
    });

    const protectClose = (event: BeforeUnloadEvent) => {
      if (!useDocumentStore.getState().dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectClose);

    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("beforeunload", protectClose);
    };
  }, []);
}
