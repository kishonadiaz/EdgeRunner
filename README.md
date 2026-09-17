# EdgeRunner

EdgeRunner is an open-source mixed reality IDE I'm building for Meta Quest.

The idea is to experiment with what software development could look like in mixed reality while still using a Windows PC for the parts that make more sense on a desktop.

I'm building the project as part of a YouTube course where I document the development process and explain the technologies as I use them.

## How It Works

EdgeRunner has two main parts.

### EdgeRunner Spatial

This is the mixed reality application that runs on Meta Quest.

It's built with:

- Kotlin
- Meta Spatial SDK
- Android Studio
- Meta Developers Hub

This is where the spatial interface, virtual workspace, and interactions will live.

### EdgeRunner Companion

This is the Windows application that runs alongside the Quest application.

It's built with:

- C#
- .NET
- Visual Studio 2026 Community

The companion handles the PC side of the project and provides communication between the Quest and Windows.

The basic idea is:

```text
Meta Quest
    |
    v
EdgeRunner Spatial
Kotlin + Meta Spatial SDK
    |
    | Communication
    v
EdgeRunner Companion
C# + .NET
    |
    v
Windows PC