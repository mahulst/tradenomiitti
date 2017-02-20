module User exposing (..)

import Html as H exposing (Html)
import Html.Attributes as A
import Html.Events as E
import Http
import Json.Decode exposing (Decoder, string, list)
import Json.Decode.Pipeline exposing (decode, required, optional)

type alias User =
  { name : String
  , description : String
  , positions : List String
  }

userDecoder : Decoder User
userDecoder =
  decode User
    |> required "first_name" string
    |> required "description" string
    |> required "positions" (list string)

-- UPDATE

type Msg = UpdateUser (Result Http.Error User) | NoOp

update : Msg -> Maybe User -> ( Maybe User, Cmd Msg)
update msg user =
  case msg of
    UpdateUser (Ok updatedUser) ->
      Just updatedUser ! []
    -- TODO: show error instead of spinning in case of user not found
    UpdateUser (Err _) ->
      Nothing ! []

    NoOp ->
      user ! []

getUser : Int -> Cmd Msg
getUser userId =
  let
    url = "/api/user/" ++ (toString userId)
    request = Http.get url userDecoder
  in
    Http.send UpdateUser request


-- VIEW

view : Maybe User -> Html Msg
view userMaybe =
  userMaybe
    |> Maybe.map viewUser
    |> Maybe.withDefault (H.div [] [ H.text "spinning"])


viewUser : User -> Html Msg
viewUser user =
  H.div
    []
    [ H.h1 [] [ H.text "Profiili" ]
    , viewProfileForm user
    ]

viewProfileForm : User -> Html Msg
viewProfileForm user =
  H.form
    []
    [ H.div
        [ A.class "form-group"]
        [ H.label [] [ H.text "Millä nimellä meidän tulisi kutsua sinua?" ]
        , H.input
          [ A.value user.name
          , A.class "form-control"
          , E.onInput <| always NoOp
          ] []
        ]
    , H.div
      [ A.class "form-group" ]
      [ H.label [] [ H.text "Kuvaile itseäsi" ]
      , H.input
        [ A.value user.description
        , A.class "form-control"
        , E.onInput <| always NoOp
        ] []
      ]
    , H.div
      [ A.class "form-group" ]
      ([ H.label [] [ H.text "Tehtävät, joista sinulla on kokemusta" ]] ++
         viewPositions user.positions)
    ]

viewPositions : List String -> List (Html Msg)
viewPositions positions =
  List.map (\position -> H.input
              [ A.value position
              , A.class "form-control"
              , E.onInput <| always NoOp
              ] []) positions
