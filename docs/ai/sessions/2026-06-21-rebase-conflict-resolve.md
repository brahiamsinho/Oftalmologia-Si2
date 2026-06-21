# 2026-06-21 Rebase conflict resolution

- Resolved CU23/CU24/CU25 rebase conflicts after rebasing 79b56bf onto origin/main.
- Preserved CU25 polling notifications, patient chatbot access, patient quick access entry point, patient-friendly chatbot copy, and the human derivation flow.
- Fixed the mobile conflict so `PatientQuickAccessRow` still matches the current `PatientHomeScreen` callback signature.
- Kept `IaAccess` simple and compatible with `VirtualAssistantScreen`.
- Updated docs to match the working tree state and removed merge markers from the touched files.
